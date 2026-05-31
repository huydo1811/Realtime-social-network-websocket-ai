package com.social.call.domain.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "call_events")
public class CallEventLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "call_id", nullable = false)
    private String callId;

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @PrePersist
    public void prePersist() {
        if (occurredAt == null) {
            occurredAt = LocalDateTime.now();
        }
    }

    public static CallEventLog create(String callId, String eventType, Long actorId, String payload) {
        CallEventLog row = new CallEventLog();
        row.callId = callId;
        row.eventType = eventType;
        row.actorId = actorId;
        row.payload = payload;
        row.occurredAt = LocalDateTime.now();
        return row;
    }

    public Long getId() {
        return id;
    }

    public String getCallId() {
        return callId;
    }

    public String getEventType() {
        return eventType;
    }

    public Long getActorId() {
        return actorId;
    }

    public String getPayload() {
        return payload;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }
}
