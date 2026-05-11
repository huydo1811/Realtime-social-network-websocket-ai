package com.social.call.domain.entities;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class CallSession implements Serializable {
    private String callId;
    private Long callerId;
    private Long calleeId;
    private String mediaType;
    private CallSessionState state;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime expiresAt;
    private Map<Long, String> activeDeviceByUser = new ConcurrentHashMap<>();
    private Map<String, Object> metadata = new ConcurrentHashMap<>();

    public static CallSession create(String callId, Long callerId, Long calleeId, String mediaType, LocalDateTime expiresAt) {
        CallSession session = new CallSession();
        session.callId = callId;
        session.callerId = callerId;
        session.calleeId = calleeId;
        session.mediaType = mediaType;
        session.state = CallSessionState.INVITING;
        session.createdAt = LocalDateTime.now();
        session.updatedAt = session.createdAt;
        session.expiresAt = expiresAt;
        return session;
    }

    public boolean containsUser(Long userId) {
        return userId != null && (userId.equals(callerId) || userId.equals(calleeId));
    }

    public Long getPeerOf(Long userId) {
        if (userId == null) {
            return null;
        }
        if (userId.equals(callerId)) {
            return calleeId;
        }
        if (userId.equals(calleeId)) {
            return callerId;
        }
        return null;
    }

    public void changeState(CallSessionState next) {
        this.state = next;
        this.updatedAt = LocalDateTime.now();
    }

    public String getCallId() {
        return callId;
    }

    public Long getCallerId() {
        return callerId;
    }

    public Long getCalleeId() {
        return calleeId;
    }

    public String getMediaType() {
        return mediaType;
    }

    public CallSessionState getState() {
        return state;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public Map<Long, String> getActiveDeviceByUser() {
        return activeDeviceByUser;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setCallId(String callId) {
        this.callId = callId;
    }

    public void setCallerId(Long callerId) {
        this.callerId = callerId;
    }

    public void setCalleeId(Long calleeId) {
        this.calleeId = calleeId;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }

    public void setState(CallSessionState state) {
        this.state = state;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public void setActiveDeviceByUser(Map<Long, String> activeDeviceByUser) {
        this.activeDeviceByUser = activeDeviceByUser;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
