package com.social.call.domain.repositories;

import java.util.Optional;

import com.social.call.domain.entities.CallSession;
import com.social.call.domain.entities.CallSessionState;

public interface CallRuntimeSessionRepository {
    CallSession createInvite(Long callerId, Long calleeId, String mediaType, String preferredCallId, Runnable timeoutAction);

    Optional<CallSession> findSession(String callId);

    void saveSession(CallSession session);

    void moveToConnected(CallSession session, Long userId, String deviceId);

    void markTerminalState(CallSession session, CallSessionState state);

    boolean hasActiveCall(Long userId);

    void registerUserSession(Long userId, String sessionId);

    void unregisterUserSession(Long userId, String sessionId);
}
