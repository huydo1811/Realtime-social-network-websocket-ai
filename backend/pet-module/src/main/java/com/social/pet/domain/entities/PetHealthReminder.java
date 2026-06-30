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
@Table(name = "pet_health_reminders")
public class PetHealthReminder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pet_id", nullable = false)
    private Long petId;

    @Column(name = "health_record_id")
    private Long healthRecordId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "reminder_type", nullable = false, length = 30)
    private PetHealthRecordType reminderType;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PetReminderStatus status;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected PetHealthReminder() {
    }

    public static PetHealthReminder create(
            Long petId,
            Long actorId,
            Long healthRecordId,
            String title,
            PetHealthRecordType reminderType,
            LocalDate dueDate,
            String note) {
        PetHealthReminder reminder = new PetHealthReminder();
        reminder.petId = petId;
        reminder.createdByUserId = actorId;
        reminder.healthRecordId = healthRecordId;
        reminder.title = normalizeTitle(title);
        reminder.reminderType = reminderType == null ? PetHealthRecordType.OTHER : reminderType;
        reminder.dueDate = requireDueDate(dueDate);
        reminder.status = PetReminderStatus.PENDING;
        reminder.note = normalizeOptional(note, 2000);
        return reminder;
    }

    public void update(
            String title,
            PetHealthRecordType reminderType,
            LocalDate dueDate,
            String note) {
        this.title = normalizeTitle(title);
        if (reminderType != null) {
            this.reminderType = reminderType;
        }
        if (dueDate != null) {
            this.dueDate = requireDueDate(dueDate);
        }
        this.note = normalizeOptional(note, 2000);
    }

    public void complete() {
        if (status == PetReminderStatus.DISMISSED) {
            throw new IllegalStateException("Không thể hoàn thành nhắc nhở đã bỏ qua");
        }
        this.status = PetReminderStatus.COMPLETED;
    }

    public void dismiss() {
        this.status = PetReminderStatus.DISMISSED;
    }

    private static LocalDate requireDueDate(LocalDate dueDate) {
        if (dueDate == null) {
            throw new IllegalArgumentException("Ngày nhắc không được để trống");
        }
        return dueDate;
    }

    private static String normalizeTitle(String input) {
        String value = input == null ? "" : input.trim();
        if (value.isBlank()) {
            throw new IllegalArgumentException("Tiêu đề nhắc nhở không được để trống");
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

    public Long getHealthRecordId() {
        return healthRecordId;
    }

    public String getTitle() {
        return title;
    }

    public PetHealthRecordType getReminderType() {
        return reminderType;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public PetReminderStatus getStatus() {
        return status;
    }

    public String getNote() {
        return note;
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
