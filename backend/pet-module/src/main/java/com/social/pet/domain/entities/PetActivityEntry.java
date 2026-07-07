package com.social.pet.domain.entities;

import java.time.LocalDate;
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
@Table(name = "pet_activity_entries")
public class PetActivityEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pet_id", nullable = false)
    private Long petId;

    @Column(name = "minutes", nullable = false)
    private Integer minutes;

    @Column(name = "activity_type", nullable = false, length = 100)
    private String activityType;

    @Column(name = "recorded_at", nullable = false)
    private LocalDate recordedAt;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected PetActivityEntry() {
    }

    public static PetActivityEntry create(Long petId, Integer minutes, String activityType, String note) {
        if (minutes == null || minutes <= 0) {
            throw new IllegalArgumentException("Thời gian hoạt động phải lớn hơn 0");
        }
        PetActivityEntry entry = new PetActivityEntry();
        entry.petId = petId;
        entry.minutes = minutes;
        entry.activityType = normalizeActivityType(activityType);
        entry.recordedAt = LocalDate.now();
        entry.note = normalizeOptional(note, 2000);
        return entry;
    }

    private static String normalizeActivityType(String input) {
        String value = input == null ? "" : input.trim();
        if (value.isBlank()) {
            throw new IllegalArgumentException("Loại hoạt động không được để trống");
        }
        if (value.length() > 100) {
            throw new IllegalArgumentException("Loại hoạt động vượt quá 100 ký tự");
        }
        return value;
    }

    private static String normalizeOptional(String input, int maxLength) {
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

    public Integer getMinutes() {
        return minutes;
    }

    public String getActivityType() {
        return activityType;
    }

    public LocalDate getRecordedAt() {
        return recordedAt;
    }

    public String getNote() {
        return note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
