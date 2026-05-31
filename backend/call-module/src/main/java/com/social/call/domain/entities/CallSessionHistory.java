package com.social.call.domain.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "call_sessions")
public class CallSessionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "call_id", nullable = false, unique = true)
    private String callId;

    @Column(name = "caller_id", nullable = false)
    private Long callerId;

    @Column(name = "callee_id", nullable = false)
    private Long calleeId;

    @Column(name = "media_type", nullable = false, length = 16)
    private String mediaType;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "end_reason")
    private String endReason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static CallSessionHistory create(String callId, Long callerId, Long calleeId, String mediaType, String status) {
        CallSessionHistory history = new CallSessionHistory();
        history.callId = callId;
        history.callerId = callerId;
        history.calleeId = calleeId;
        history.mediaType = mediaType;
        history.status = status;
        history.startedAt = LocalDateTime.now();
        return history;
    }

    public void updateStatus(String status, String endReason) {
        this.status = status;
        if ("CONNECTED".equals(status) && this.answeredAt == null) {
            this.answeredAt = LocalDateTime.now();
        }
        if ("ENDED".equals(status) || "CANCELED".equals(status) || "REJECTED".equals(status) || "TIMEOUT".equals(status)) {
            this.endedAt = LocalDateTime.now();
            this.endReason = endReason;
        }
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
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

    public String getStatus() {
        return status;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getAnsweredAt() {
        return answeredAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public String getEndReason() {
        return endReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
