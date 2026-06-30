package com.social.pet.domain.entities;

import java.time.LocalDate;
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
@Table(name = "pet_health_records")
public class PetHealthRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pet_id", nullable = false)
    private Long petId;

    @Enumerated(EnumType.STRING)
    @Column(name = "record_type", nullable = false, length = 30)
    private PetHealthRecordType recordType;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "performed_at", nullable = false)
    private LocalDate performedAt;

    @Column(name = "clinic_name", length = 200)
    private String clinicName;

    @Column(name = "document_url", columnDefinition = "TEXT")
    private String documentUrl;

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected PetHealthRecord() {
    }

    public static PetHealthRecord create(
            Long petId,
            Long actorId,
            PetHealthRecordType recordType,
            String title,
            String description,
            LocalDate performedAt,
            String clinicName,
            String documentUrl) {
        PetHealthRecord record = new PetHealthRecord();
        record.petId = petId;
        record.createdByUserId = actorId;
        record.recordType = recordType == null ? PetHealthRecordType.OTHER : recordType;
        record.title = normalizeTitle(title);
        record.description = normalizeOptional(description, 2000);
        record.performedAt = performedAt == null
                ? LocalDate.now()
                : performedAt;
        record.clinicName = normalizeOptional(clinicName, 200);
        record.documentUrl = normalizeOptional(documentUrl, 2048);
        return record;
    }

    public void update(
            PetHealthRecordType recordType,
            String title,
            String description,
            LocalDate performedAt,
            String clinicName,
            String documentUrl) {
        if (recordType != null) {
            this.recordType = recordType;
        }
        this.title = normalizeTitle(title);
        this.description = normalizeOptional(description, 2000);
        if (performedAt != null) {
            this.performedAt = performedAt;
        }
        this.clinicName = normalizeOptional(clinicName, 200);
        this.documentUrl = normalizeOptional(documentUrl, 2048);
    }

    private static String normalizeTitle(String input) {
        String value = input == null ? "" : input.trim();
        if (value.isBlank()) {
            throw new IllegalArgumentException("Tiêu đề không được để trống");
        }
        if (value.length() > 200) {
            throw new IllegalArgumentException("Tiêu đề vượt quá 200 ký tự");
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

    public PetHealthRecordType getRecordType() {
        return recordType;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public LocalDate getPerformedAt() {
        return performedAt;
    }

    public String getClinicName() {
        return clinicName;
    }

    public String getDocumentUrl() {
        return documentUrl;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
