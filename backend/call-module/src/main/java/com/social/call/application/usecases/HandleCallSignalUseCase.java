package com.social.call.application.usecases;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.social.call.application.dto.CallSignalRequest;
import com.social.call.application.ratelimit.CallRateLimiter;
import com.social.call.application.validation.CallRequestValidator;
import com.social.call.domain.constants.CallWebSocketEvents;
import com.social.call.domain.entities.CallEventLog;
import com.social.call.domain.entities.CallSession;
import com.social.call.domain.entities.CallSessionHistory;
import com.social.call.domain.entities.CallSessionState;
import com.social.call.domain.events.CallEventPublisher;
import com.social.call.domain.events.CallRealtimeEvent;
import com.social.call.domain.exceptions.CallException;
import com.social.call.domain.repositories.CallEventLogRepository;
import com.social.call.domain.repositories.CallRuntimeSessionRepository;
import com.social.call.domain.repositories.CallSessionHistoryRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class HandleCallSignalUseCase {

    private static final Logger log = LoggerFactory.getLogger(HandleCallSignalUseCase.class);

    private final CallRequestValidator validator;
    private final CallRateLimiter rateLimiter;
    private final CallRuntimeSessionRepository runtimeSessionRepository;
    private final CallEventPublisher eventPublisher;
    private final UserRepository userRepository;
    private final CallSessionHistoryRepository callSessionHistoryRepository;
    private final CallEventLogRepository callEventLogRepository;
    private final ObjectMapper objectMapper;

    public HandleCallSignalUseCase(CallRequestValidator validator,
            CallRateLimiter rateLimiter,
            CallRuntimeSessionRepository runtimeSessionRepository,
            CallEventPublisher eventPublisher,
            UserRepository userRepository,
            CallSessionHistoryRepository callSessionHistoryRepository,
            CallEventLogRepository callEventLogRepository,
            ObjectMapper objectMapper) {
        this.validator = validator;
        this.rateLimiter = rateLimiter;
        this.runtimeSessionRepository = runtimeSessionRepository;
        this.eventPublisher = eventPublisher;
        this.userRepository = userRepository;
        this.callSessionHistoryRepository = callSessionHistoryRepository;
        this.callEventLogRepository = callEventLogRepository;
        this.objectMapper = objectMapper;
    }

    public void execute(Long actorId, CallSignalRequest request) {
        validator.validate(request);
        if (!rateLimiter.allow(actorId, request.getEventType())) {
            throw new CallException("Too many requests");
        }

        switch (request.getEventType()) {
            case CallWebSocketEvents.CALL_INVITE -> onInvite(actorId, request);
            case CallWebSocketEvents.CALL_ACCEPT -> onAccept(actorId, request);
            case CallWebSocketEvents.CALL_REJECT -> onReject(actorId, request);
            case CallWebSocketEvents.CALL_END -> onEnd(actorId, request, CallWebSocketEvents.CALL_END);
            case CallWebSocketEvents.CALL_CANCEL -> onEnd(actorId, request, CallWebSocketEvents.CALL_CANCEL);
            case CallWebSocketEvents.WEBRTC_OFFER,
                    CallWebSocketEvents.WEBRTC_ANSWER,
                    CallWebSocketEvents.WEBRTC_ICE_CANDIDATE -> onWebRtc(actorId, request);
            case CallWebSocketEvents.CALL_RECONNECT -> onReconnect(actorId, request);
            default -> throw new CallException("Unsupported eventType");
        }
    }

    private void onInvite(Long actorId, CallSignalRequest request) {
        Long targetUserId = request.getTargetUserId();
        if (targetUserId.equals(actorId)) {
            throw new CallException("Cannot call yourself");
        }
        if (userRepository.findById(targetUserId).isEmpty()) {
            throw new CallException("Target user not found");
        }
        if (runtimeSessionRepository.hasActiveCall(targetUserId)) {
            publish(buildEvent(
                    CallWebSocketEvents.CALL_BUSY,
                    request.getCallId(),
                    targetUserId,
                    actorId,
                    request.getMediaType(),
                    "busy",
                    Map.of("targetUserId", targetUserId)));
            return;
        }

        CallSession session = runtimeSessionRepository.createInvite(
                actorId,
                targetUserId,
                request.getMediaType(),
                request.getCallId(),
                () -> onInviteTimeout(actorId, targetUserId, request.getMediaType(), request.getCallId()));

        CallSessionHistory history = CallSessionHistory.create(
                session.getCallId(),
                session.getCallerId(),
                session.getCalleeId(),
                session.getMediaType(),
                session.getState().name());
        callSessionHistoryRepository.save(history);

        publish(buildEvent(
                CallWebSocketEvents.CALL_INVITE,
                session.getCallId(),
                actorId,
                targetUserId,
                session.getMediaType(),
                null,
                request.getPayload()));
        publish(buildEvent(
                CallWebSocketEvents.USER_RINGING,
                session.getCallId(),
                targetUserId,
                actorId,
                session.getMediaType(),
                null,
                Map.of("ringing", true)));
    }

    private void onAccept(Long actorId, CallSignalRequest request) {
        CallSession session = requireSessionAndParticipant(request.getCallId(), actorId);
        session.changeState(CallSessionState.CONNECTED);
        session.getActiveDeviceByUser().put(actorId, request.getDeviceId());
        runtimeSessionRepository.moveToConnected(session, actorId, request.getDeviceId());
        updateHistory(session.getCallId(), CallSessionState.CONNECTED, null);

        publish(buildEvent(
                CallWebSocketEvents.CALL_ACCEPT,
                session.getCallId(),
                actorId,
                session.getPeerOf(actorId),
                session.getMediaType(),
                null,
                request.getPayload()));
        publish(buildEvent(
                CallWebSocketEvents.CALL_CONNECTED,
                session.getCallId(),
                actorId,
                session.getPeerOf(actorId),
                session.getMediaType(),
                null,
                Map.of("state", session.getState().name())));
    }

    private void onReject(Long actorId, CallSignalRequest request) {
        CallSession session = requireSessionAndParticipant(request.getCallId(), actorId);
        runtimeSessionRepository.markTerminalState(session, CallSessionState.REJECTED);
        updateHistory(session.getCallId(), CallSessionState.REJECTED, "rejected");
        publish(buildEvent(
                CallWebSocketEvents.CALL_REJECT,
                session.getCallId(),
                actorId,
                session.getPeerOf(actorId),
                session.getMediaType(),
                "rejected",
                request.getPayload()));
    }

    private void onEnd(Long actorId, CallSignalRequest request, String eventType) {
        CallSession session = requireSessionAndParticipant(request.getCallId(), actorId);
        CallSessionState terminalState = CallWebSocketEvents.CALL_CANCEL.equals(eventType)
                ? CallSessionState.CANCELED
                : CallSessionState.ENDED;
        runtimeSessionRepository.markTerminalState(session, terminalState);
        String reason = terminalState.name().toLowerCase();
        updateHistory(session.getCallId(), terminalState, reason);
        publish(buildEvent(
                eventType,
                session.getCallId(),
                actorId,
                session.getPeerOf(actorId),
                session.getMediaType(),
                reason,
                request.getPayload()));
    }

    private void onWebRtc(Long actorId, CallSignalRequest request) {
        CallSession session = requireSessionAndParticipant(request.getCallId(), actorId);
        if (session.getState() != CallSessionState.CONNECTED && session.getState() != CallSessionState.RINGING) {
            throw new CallException("Call is not active for WebRTC signal");
        }
        publish(buildEvent(
                request.getEventType(),
                session.getCallId(),
                actorId,
                session.getPeerOf(actorId),
                session.getMediaType(),
                null,
                request.getPayload()));
    }

    private void onReconnect(Long actorId, CallSignalRequest request) {
        CallSession session = requireSessionAndParticipant(request.getCallId(), actorId);
        session.getActiveDeviceByUser().put(actorId, request.getDeviceId());
        runtimeSessionRepository.saveSession(session);
        Map<String, Object> payload = new HashMap<>();
        payload.put("state", session.getState().name());
        payload.put("devices", session.getActiveDeviceByUser());
        publish(buildEvent(
                CallWebSocketEvents.CALL_RECONNECT,
                session.getCallId(),
                actorId,
                session.getPeerOf(actorId),
                session.getMediaType(),
                null,
                payload));
        publish(buildEvent(
                CallWebSocketEvents.CALL_STATE_SYNC,
                session.getCallId(),
                actorId,
                session.getPeerOf(actorId),
                session.getMediaType(),
                null,
                payload));
    }

    private CallSession requireSessionAndParticipant(String callId, Long actorId) {
        CallSession session = runtimeSessionRepository.findSession(callId)
                .orElseThrow(() -> new CallException("Call session not found"));
        if (!session.containsUser(actorId)) {
            throw new CallException("Permission denied for call session");
        }
        return session;
    }

    private void onInviteTimeout(Long callerId, Long calleeId, String mediaType, String callId) {
        Optional<CallSession> optionalSession = runtimeSessionRepository.findSession(callId);
        if (optionalSession.isEmpty()) {
            return;
        }
        CallSession session = optionalSession.get();
        if (session.getState() != CallSessionState.RINGING && session.getState() != CallSessionState.INVITING) {
            return;
        }
        runtimeSessionRepository.markTerminalState(session, CallSessionState.TIMEOUT);
        updateHistory(session.getCallId(), CallSessionState.TIMEOUT, "missed_call");
        Map<String, Object> payload = Map.of("missed", true);
        publish(buildEvent(CallWebSocketEvents.CALL_TIMEOUT, session.getCallId(), calleeId, callerId, mediaType, "missed_call", payload));
        publish(buildEvent(CallWebSocketEvents.CALL_TIMEOUT, session.getCallId(), callerId, calleeId, mediaType, "missed_call", payload));
    }

    private void publish(CallRealtimeEvent event) {
        eventPublisher.publish(event);
        if (event.getCallId() == null || event.getCallId().isBlank()) {
            return;
        }
        String payload;
        try {
            payload = objectMapper.writeValueAsString(event.getPayload());
        } catch (JsonProcessingException ex) {
            payload = "{}";
        }
        try {
            callEventLogRepository.save(CallEventLog.create(event.getCallId(), event.getEventType(), event.getFromUserId(), payload));
        } catch (RuntimeException ex) {
            log.warn("call_events persist skipped: {}", ex.getMessage());
        }
    }

    private void updateHistory(String callId, CallSessionState state, String reason) {
        callSessionHistoryRepository.findByCallId(callId).ifPresent(history -> {
            history.updateStatus(state.name(), reason);
            callSessionHistoryRepository.save(history);
        });
    }

    private CallRealtimeEvent buildEvent(String eventType,
            String callId,
            Long fromUserId,
            Long toUserId,
            String mediaType,
            String reason,
            Map<String, Object> payload) {
        CallRealtimeEvent event = new CallRealtimeEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventType(eventType);
        event.setCallId(callId);
        event.setFromUserId(fromUserId);
        event.setToUserId(toUserId);
        event.setMediaType(mediaType);
        event.setReason(reason);
        event.setOccurredAt(LocalDateTime.now());
        event.setPayload(payload == null ? Map.of() : payload);
        return event;
    }
}
