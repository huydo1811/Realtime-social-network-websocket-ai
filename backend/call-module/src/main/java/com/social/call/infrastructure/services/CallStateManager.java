package com.social.call.infrastructure.services;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ScheduledFuture;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.social.call.domain.entities.CallSession;
import com.social.call.domain.entities.CallSessionState;
import com.social.call.domain.exceptions.CallException;
import com.social.call.domain.repositories.CallRuntimeSessionRepository;

@Component
public class CallStateManager implements CallRuntimeSessionRepository {

    private static final Duration CALL_TTL = Duration.ofMinutes(5);
    private static final Duration CALL_TIMEOUT = Duration.ofSeconds(30);
    private static final Duration LOCK_TTL = Duration.ofSeconds(5);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final TaskScheduler taskScheduler;
    private final ConcurrentMap<String, ScheduledFuture<?>> timeoutTasks = new ConcurrentHashMap<>();
    private final ConcurrentMap<Long, Set<String>> userSessions = new ConcurrentHashMap<>();

    public CallStateManager(StringRedisTemplate redisTemplate, ObjectMapper objectMapper,
            @Qualifier("callTaskScheduler") TaskScheduler taskScheduler) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.taskScheduler = taskScheduler;
    }

    @Override
    public CallSession createInvite(Long callerId, Long calleeId, String mediaType, String preferredCallId, Runnable timeoutAction) {
        String callId = preferredCallId == null || preferredCallId.isBlank()
                ? UUID.randomUUID().toString()
                : preferredCallId;

        String lockKey = pairLockKey(callerId, calleeId);
        boolean acquired = Boolean.TRUE.equals(redisTemplate.opsForValue().setIfAbsent(lockKey, callId, LOCK_TTL));
        if (!acquired) {
            throw new CallException("Concurrent call request. Please retry");
        }

        try {
            if (hasActiveCall(callerId) || hasActiveCall(calleeId)) {
                throw new CallException("One participant is already in another call");
            }

            CallSession session = CallSession.create(
                    callId,
                    callerId,
                    calleeId,
                    mediaType,
                    LocalDateTime.now().plus(CALL_TIMEOUT));
            session.changeState(CallSessionState.RINGING);
            saveSession(session);
            bindUserCall(callerId, callId);
            bindUserCall(calleeId, callId);
            scheduleTimeout(callId, timeoutAction);
            return session;
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    @Override
    public Optional<CallSession> findSession(String callId) {
        String raw = redisTemplate.opsForValue().get(callKey(callId));
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.ofNullable(objectMapper.readValue(raw, CallSession.class));
        } catch (JsonProcessingException e) {
            throw new CallException("Failed to decode call session");
        }
    }

    @Override
    public void saveSession(CallSession session) {
        try {
            redisTemplate.opsForValue().set(callKey(session.getCallId()), objectMapper.writeValueAsString(session), CALL_TTL);
        } catch (JsonProcessingException e) {
            throw new CallException("Failed to encode call session");
        }
    }

    @Override
    public void moveToConnected(CallSession session, Long userId, String deviceId) {
        session.getActiveDeviceByUser().put(userId, deviceId);
        session.changeState(CallSessionState.CONNECTED);
        saveSession(session);
        cancelTimeout(session.getCallId());
    }

    @Override
    public void markTerminalState(CallSession session, CallSessionState state) {
        session.changeState(state);
        saveSession(session);
        unbindUserCall(session.getCallerId(), session.getCallId());
        unbindUserCall(session.getCalleeId(), session.getCallId());
        cancelTimeout(session.getCallId());
    }

    @Override
    public boolean hasActiveCall(Long userId) {
        String callId = redisTemplate.opsForValue().get(userCallKey(userId));
        return callId != null && !callId.isBlank();
    }

    @Override
    public void registerUserSession(Long userId, String sessionId) {
        userSessions.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet()).add(sessionId);
    }

    @Override
    public void unregisterUserSession(Long userId, String sessionId) {
        Set<String> sessions = userSessions.get(userId);
        if (sessions == null) {
            return;
        }
        sessions.remove(sessionId);
        if (sessions.isEmpty()) {
            userSessions.remove(userId);
        }
    }

    private void bindUserCall(Long userId, String callId) {
        redisTemplate.opsForValue().set(userCallKey(userId), callId, CALL_TTL);
    }

    private void unbindUserCall(Long userId, String callId) {
        String key = userCallKey(userId);
        String current = redisTemplate.opsForValue().get(key);
        if (callId.equals(current)) {
            redisTemplate.delete(key);
        }
    }

    private void scheduleTimeout(String callId, Runnable timeoutAction) {
        cancelTimeout(callId);
        ScheduledFuture<?> future = taskScheduler.schedule(
                timeoutAction,
                java.util.Date.from(java.time.Instant.now().plus(CALL_TIMEOUT)));
        if (future != null) {
            timeoutTasks.put(callId, future);
        }
    }

    private void cancelTimeout(String callId) {
        ScheduledFuture<?> future = timeoutTasks.remove(callId);
        if (future != null) {
            future.cancel(false);
        }
    }

    private String pairLockKey(Long a, Long b) {
        long min = Math.min(a, b);
        long max = Math.max(a, b);
        return "call:lock:%d:%d".formatted(min, max);
    }

    private String callKey(String callId) {
        return "call:session:%s".formatted(callId);
    }

    private String userCallKey(Long userId) {
        return "call:user:%d:active".formatted(userId);
    }
}
