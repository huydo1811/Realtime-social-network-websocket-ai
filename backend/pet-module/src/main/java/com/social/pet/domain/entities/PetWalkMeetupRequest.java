package com.social.pet.domain.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "pet_walk_meetup_requests")
public class PetWalkMeetupRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "walk_session_id", nullable = false)
    private Long walkSessionId;

    @Column(name = "requester_user_id", nullable = false)
    private Long requesterUserId;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "meetup_latitude")
    private Double meetupLatitude;

    @Column(name = "meetup_longitude")
    private Double meetupLongitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PetWalkMeetupStatus status;

    @Column(name = "responded_by_user_id")
    private Long respondedByUserId;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected PetWalkMeetupRequest() {
    }

    public static PetWalkMeetupRequest create(
            Long walkSessionId,
            Long requesterUserId,
            String message,
            Double meetupLatitude,
            Double meetupLongitude) {
        PetWalkMeetupRequest request = new PetWalkMeetupRequest();
        request.walkSessionId = walkSessionId;
        request.requesterUserId = requesterUserId;
        request.message = normalizeText(message, 1000);
        request.meetupLatitude = meetupLatitude;
        request.meetupLongitude = meetupLongitude;
        request.status = PetWalkMeetupStatus.PENDING;
        return request;
    }

    public void accept(Long actorId) {
        markResponse(actorId, PetWalkMeetupStatus.ACCEPTED);
    }

    public void decline(Long actorId) {
        markResponse(actorId, PetWalkMeetupStatus.DECLINED);
    }

    public void cancel(Long actorId) {
        if (!requesterUserId.equals(actorId)) {
            throw new IllegalStateException("Bạn không có quyền hủy lời mời này");
        }
        this.status = PetWalkMeetupStatus.CANCELLED;
        this.respondedByUserId = actorId;
        this.respondedAt = LocalDateTime.now();
    }

    private void markResponse(Long actorId, PetWalkMeetupStatus status) {
        if (this.status != PetWalkMeetupStatus.PENDING) {
            throw new IllegalStateException("Lời mời đã được xử lý");
        }
        this.status = status;
        this.respondedByUserId = actorId;
        this.respondedAt = LocalDateTime.now();
    }

    private static String normalizeText(String input, int maxLength) {
        if (input == null) {
            return null;
        }
        String value = input.trim();
        if (value.isBlank()) {
            return null;
        }
        if (value.length() > maxLength) {
            throw new IllegalArgumentException("Nội dung vượt quá " + maxLength + " ký tự");
        }
        return value;
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

    public Long getWalkSessionId() {
        return walkSessionId;
    }

    public Long getRequesterUserId() {
        return requesterUserId;
    }

    public String getMessage() {
        return message;
    }

    public Double getMeetupLatitude() {
        return meetupLatitude;
    }

    public Double getMeetupLongitude() {
        return meetupLongitude;
    }

    public PetWalkMeetupStatus getStatus() {
        return status;
    }

    public Long getRespondedByUserId() {
        return respondedByUserId;
    }

    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}