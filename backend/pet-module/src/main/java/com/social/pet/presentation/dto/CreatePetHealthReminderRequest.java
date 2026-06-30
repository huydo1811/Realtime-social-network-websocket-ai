package com.social.pet.presentation.dto;

import java.time.LocalDate;

import com.social.pet.domain.entities.PetHealthRecordType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreatePetHealthReminderRequest {
    private Long healthRecordId;

    @NotBlank(message = "Tiêu đề nhắc nhở không được để trống")
    @Size(max = 200, message = "Tiêu đề vượt quá 200 ký tự")
    private String title;

    @NotNull(message = "Loại nhắc nhở không được để trống")
    private PetHealthRecordType reminderType;

    @NotNull(message = "Ngày nhắc không được để trống")
    private LocalDate dueDate;

    @Size(max = 2000, message = "Ghi chú vượt quá 2000 ký tự")
    private String note;

    public Long getHealthRecordId() {
        return healthRecordId;
    }

    public void setHealthRecordId(Long healthRecordId) {
        this.healthRecordId = healthRecordId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public PetHealthRecordType getReminderType() {
        return reminderType;
    }

    public void setReminderType(PetHealthRecordType reminderType) {
        this.reminderType = reminderType;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
