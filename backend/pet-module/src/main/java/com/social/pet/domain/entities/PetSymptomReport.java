package com.social.pet.domain.entities;

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
@Table(name = "pet_symptom_reports")
public class PetSymptomReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pet_id", nullable = false)
    private Long petId;

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(name = "symptoms_text", nullable = false, columnDefinition = "TEXT")
    private String symptomsText;

    @Column(name = "temperature_c")
    private Double temperatureC;

    @Column(name = "duration_hours")
    private Integer durationHours;

    @Column(name = "appetite_loss")
    private Boolean appetiteLoss;

    @Column(name = "energy_drop")
    private Boolean energyDrop;

    @Column(name = "vomiting")
    private Boolean vomiting;

    @Column(name = "diarrhea")
    private Boolean diarrhea;

    @Column(name = "cough")
    private Boolean cough;

    @Column(name = "breathing_difficulty")
    private Boolean breathingDifficulty;

    @Column(name = "skin_rash")
    private Boolean skinRash;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected PetSymptomReport() {
    }

    public static PetSymptomReport create(
            Long petId,
            Long createdByUserId,
            String symptomsText,
            Double temperatureC,
            Integer durationHours,
            Boolean appetiteLoss,
            Boolean energyDrop,
            Boolean vomiting,
            Boolean diarrhea,
            Boolean cough,
            Boolean breathingDifficulty,
            Boolean skinRash) {
        PetSymptomReport report = new PetSymptomReport();
        report.petId = petId;
        report.createdByUserId = createdByUserId;
        report.symptomsText = normalizeText(symptomsText, 4000);
        report.temperatureC = temperatureC;
        report.durationHours = durationHours;
        report.appetiteLoss = appetiteLoss;
        report.energyDrop = energyDrop;
        report.vomiting = vomiting;
        report.diarrhea = diarrhea;
        report.cough = cough;
        report.breathingDifficulty = breathingDifficulty;
        report.skinRash = skinRash;
        return report;
    }

    private static String normalizeText(String input, int maxLength) {
        String value = input == null ? "" : input.trim();
        if (value.isBlank()) {
            throw new IllegalArgumentException("Triệu chứng không được để trống");
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

    public String getSymptomsText() {
        return symptomsText;
    }

    public Double getTemperatureC() {
        return temperatureC;
    }

    public Integer getDurationHours() {
        return durationHours;
    }

    public Boolean getAppetiteLoss() {
        return appetiteLoss;
    }

    public Boolean getEnergyDrop() {
        return energyDrop;
    }

    public Boolean getVomiting() {
        return vomiting;
    }

    public Boolean getDiarrhea() {
        return diarrhea;
    }

    public Boolean getCough() {
        return cough;
    }

    public Boolean getBreathingDifficulty() {
        return breathingDifficulty;
    }

    public Boolean getSkinRash() {
        return skinRash;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}