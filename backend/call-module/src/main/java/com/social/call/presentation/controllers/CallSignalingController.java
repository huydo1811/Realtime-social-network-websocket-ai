package com.social.call.presentation.controllers;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import com.social.auth.infrastructure.security.JwtService;
import com.social.call.application.dto.CallSignalRequest;
import com.social.call.application.usecases.HandleCallSignalUseCase;
import com.social.call.domain.constants.CallWebSocketEvents;
import com.social.call.domain.events.CallEventPublisher;
import com.social.call.domain.events.CallRealtimeEvent;
import com.social.call.domain.exceptions.CallException;

import jakarta.validation.Valid;

@Controller
public class CallSignalingController {

    private static final String SESSION_STOMP_PRINCIPAL = "com.social.call.stompPrincipal";

    private final HandleCallSignalUseCase handleCallSignalUseCase;
    private final CallEventPublisher callEventPublisher;
    private final JwtService jwtService;

    public CallSignalingController(
            HandleCallSignalUseCase handleCallSignalUseCase,
            CallEventPublisher callEventPublisher,
            JwtService jwtService) {
        this.handleCallSignalUseCase = handleCallSignalUseCase;
        this.callEventPublisher = callEventPublisher;
        this.jwtService = jwtService;
    }

    @MessageMapping("/call.signal")
    public void handleCallSignal(
            @Valid @Payload CallSignalRequest request,
            Principal principal,
            @Header(name = "simpUser", required = false) Principal simpUser,
            @Header(name = "simpSessionAttributes", required = false) Map<String, Object> sessionAttributes,
            @Header(name = "nativeHeaders", required = false) Map<String, List<String>> nativeHeaders) {
        Long actorId = parsePrincipal(principal, simpUser, sessionAttributes, nativeHeaders);
        try {
            handleCallSignalUseCase.execute(actorId, request);
        } catch (CallException ex) {
            publishError(actorId, request, ex.getMessage());
        } catch (Exception ex) {
            publishError(actorId, request, "Unexpected call signaling error");
        }
    }

    private Long parsePrincipal(
            Principal principal,
            Principal simpUser,
            Map<String, Object> sessionAttributes,
            Map<String, List<String>> nativeHeaders) {
        String userId = extractUserId(principal);
        if (userId == null) {
            userId = extractUserId(simpUser);
        }
        if (userId == null) {
            userId = extractFromSessionAttributes(sessionAttributes);
        }
        if (userId == null) {
            userId = extractFromAuthorizationHeader(nativeHeaders);
        }
        if (userId == null || userId.isBlank()) {
            throw new CallException("Unauthorized websocket principal");
        }
        try {
            return Long.parseLong(userId);
        } catch (NumberFormatException ex) {
            throw new CallException("Invalid principal");
        }
    }

    private String extractUserId(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            return null;
        }
        return principal.getName();
    }

    private String extractFromSessionAttributes(Map<String, Object> sessionAttributes) {
        if (sessionAttributes == null) {
            return null;
        }
        Object stored = sessionAttributes.get(SESSION_STOMP_PRINCIPAL);
        if (stored instanceof Principal p) {
            return extractUserId(p);
        }
        if (stored instanceof String s && !s.isBlank()) {
            return s;
        }
        return null;
    }

    private String extractFromAuthorizationHeader(Map<String, List<String>> nativeHeaders) {
        if (nativeHeaders == null) {
            return null;
        }
        List<String> authorization = nativeHeaders.get("Authorization");
        if (authorization == null || authorization.isEmpty()) {
            return null;
        }
        String value = authorization.getFirst();
        if (value == null || value.isBlank()) {
            return null;
        }
        String token = value.startsWith("Bearer ") ? value.substring(7).trim() : value.trim();
        if (token.isBlank() || !jwtService.validateToken(token)) {
            return null;
        }
        return jwtService.getSubject(token);
    }

    private void publishError(Long actorId, CallSignalRequest request, String message) {
        CallRealtimeEvent event = new CallRealtimeEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventType(CallWebSocketEvents.CALL_ERROR);
        event.setCallId(request != null ? request.getCallId() : null);
        event.setFromUserId(actorId);
        event.setToUserId(actorId);
        event.setReason(message);
        Map<String, Object> payload = new HashMap<>();
        payload.put("requestEventType", request != null ? request.getEventType() : null);
        event.setPayload(payload);
        event.setOccurredAt(LocalDateTime.now());
        callEventPublisher.publish(event);
    }
}
