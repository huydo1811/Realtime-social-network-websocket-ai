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
@Table(name = "pet_walk_sessions")
public class PetWalkSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pet_id", nullable = false)
    private Long petId;

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false, length = 20)
    private PetVisibility visibility;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PetWalkSessionStatus status;

    @Column(name = "start_latitude", nullable = false)
    private Double startLatitude;

    @Column(name = "start_longitude", nullable = false)
    private Double startLongitude;

    @Column(name = "current_latitude", nullable = false)
    private Double currentLatitude;

    @Column(name = "current_longitude", nullable = false)
    private Double currentLongitude;

    @Column(name = "route_name", length = 120)
    private String routeName;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected PetWalkSession() {
    }

    public static PetWalkSession create(
            Long petId,
            Long createdByUserId,
            PetVisibility visibility,
            Double startLatitude,
            Double startLongitude,
            String routeName,
            String note) {
        PetWalkSession session = new PetWalkSession();
        session.petId = petId;
        session.createdByUserId = createdByUserId;
        session.visibility = visibility == null ? PetVisibility.PUBLIC : visibility;
        session.status = PetWalkSessionStatus.ACTIVE;
        session.startLatitude = normalizeLatitude(startLatitude);
        session.startLongitude = normalizeLongitude(startLongitude);
        session.currentLatitude = session.startLatitude;
        session.currentLongitude = session.startLongitude;
        session.routeName = normalizeText(routeName, 120);
        session.note = normalizeText(note, 1000);
        session.startedAt = LocalDateTime.now();
        return session;
    }

    public void finish(Long actorId, Double endLatitude, Double endLongitude) {
        ensureCreator(actorId);
        if (status == PetWalkSessionStatus.FINISHED || status == PetWalkSessionStatus.CANCELLED) {
            throw new IllegalStateException("Phiên đi dạo đã kết thúc");
        }
        this.currentLatitude = normalizeLatitude(endLatitude);
        this.currentLongitude = normalizeLongitude(endLongitude);
        this.status = PetWalkSessionStatus.FINISHED;
        this.endedAt = LocalDateTime.now();
    }

    public void cancel(Long actorId) {
        ensureCreator(actorId);
        if (status == PetWalkSessionStatus.FINISHED) {
            throw new IllegalStateException("Không thể hủy phiên đã kết thúc");
        }
        this.status = PetWalkSessionStatus.CANCELLED;
        this.endedAt = LocalDateTime.now();
    }

    private void ensureCreator(Long actorId) {
        if (!createdByUserId.equals(actorId)) {
            throw new IllegalStateException("Bạn không có quyền thay đổi phiên đi dạo này");
        }
    }

    private static Double normalizeLatitude(Double latitude) {
        if (latitude == null || latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException("Vĩ độ không hợp lệ");
        }
        return latitude;
    }

    private static Double normalizeLongitude(Double longitude) {
        if (longitude == null || longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException("Kinh độ không hợp lệ");
        }
        return longitude;
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

    public Long getPetId() {
        return petId;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public PetVisibility getVisibility() {
        return visibility;
    }

    public PetWalkSessionStatus getStatus() {
        return status;
    }

    public Double getStartLatitude() {
        return startLatitude;
    }

    public Double getStartLongitude() {
        return startLongitude;
    }

    public Double getCurrentLatitude() {
        return currentLatitude;
    }

    public Double getCurrentLongitude() {
        return currentLongitude;
    }

    public String getRouteName() {
        return routeName;
    }

    public String getNote() {
        return note;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}