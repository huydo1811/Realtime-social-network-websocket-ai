package com.social.pet.presentation.dto;

import java.time.LocalDate;

import com.social.pet.domain.entities.PetHealthRecordType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreatePetHealthRecordRequest {
    @NotNull(message = "Loại hồ sơ không được để trống")
    private PetHealthRecordType recordType;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 200, message = "Tiêu đề vượt quá 200 ký tự")
    private String title;

    @Size(max = 2000, message = "Mô tả vượt quá 2000 ký tự")
    private String description;

    @NotNull(message = "Ngày thực hiện không được để trống")
    private LocalDate performedAt;

    @Size(max = 200, message = "Tên phòng khám vượt quá 200 ký tự")
    private String clinicName;

    @Size(max = 2048, message = "documentUrl vượt quá 2048 ký tự")
    private String documentUrl;

    public PetHealthRecordType getRecordType() {
        return recordType;
    }

    public void setRecordType(PetHealthRecordType recordType) {
        this.recordType = recordType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getPerformedAt() {
        return performedAt;
    }

    public void setPerformedAt(LocalDate performedAt) {
        this.performedAt = performedAt;
    }

    public String getClinicName() {
        return clinicName;
    }

    public void setClinicName(String clinicName) {
        this.clinicName = clinicName;
    }

    public String getDocumentUrl() {
        return documentUrl;
    }

    public void setDocumentUrl(String documentUrl) {
        this.documentUrl = documentUrl;
    }
}
