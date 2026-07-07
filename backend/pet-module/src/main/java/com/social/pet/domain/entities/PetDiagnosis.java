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
@Table(name = "pet_diagnoses")
public class PetDiagnosis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pet_id", nullable = false)
    private Long petId;

    @Column(name = "report_id", nullable = false)
    private Long reportId;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private PetDiagnosisSeverity severity;

    @Column(name = "summary", nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "likely_disease", nullable = false, columnDefinition = "TEXT")
    private String likelyDisease;

    @Column(name = "possible_causes", columnDefinition = "TEXT")
    private String possibleCauses;

    @Column(name = "differential_diagnoses", columnDefinition = "TEXT")
    private String differentialDiagnoses;

    @Column(name = "red_flags", columnDefinition = "TEXT")
    private String redFlags;

    @Column(name = "recommendation", nullable = false, columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "should_see_vet", nullable = false)
    private Boolean shouldSeeVet;

    @Column(name = "confidence_score", nullable = false)
    private Integer confidenceScore;

    @Column(name = "model_name", nullable = false, length = 80)
    private String modelName;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected PetDiagnosis() {
    }

    public static PetDiagnosis create(
            Long petId,
            Long reportId,
            PetDiagnosisSeverity severity,
            String summary,
            String likelyDisease,
            String possibleCauses,
            String differentialDiagnoses,
            String redFlags,
            String recommendation,
            Boolean shouldSeeVet,
            Integer confidenceScore,
            String modelName) {
        PetDiagnosis diagnosis = new PetDiagnosis();
        diagnosis.petId = petId;
        diagnosis.reportId = reportId;
        diagnosis.severity = severity == null ? PetDiagnosisSeverity.LOW : severity;
        diagnosis.summary = normalizeText(summary, 2000, true);
        diagnosis.likelyDisease = normalizeText(likelyDisease, 2000, true);
        diagnosis.possibleCauses = normalizeText(possibleCauses, 2000, false);
        diagnosis.differentialDiagnoses = normalizeText(differentialDiagnoses, 2000, false);
        diagnosis.redFlags = normalizeText(redFlags, 2000, false);
        diagnosis.recommendation = normalizeText(recommendation, 4000, true);
        diagnosis.shouldSeeVet = shouldSeeVet != null && shouldSeeVet;
        diagnosis.confidenceScore = normalizeConfidence(confidenceScore);
        diagnosis.modelName = normalizeText(modelName, 80, true);
        return diagnosis;
    }

    private static String normalizeText(String input, int maxLength, boolean required) {
        if (input == null) {
            if (required) {
                throw new IllegalArgumentException("Nội dung không được để trống");
            }
            return null;
        }
        String value = input.trim();
        if (value.isBlank()) {
            if (required) {
                throw new IllegalArgumentException("Nội dung không được để trống");
            }
            return null;
        }
        if (value.length() > maxLength) {
            throw new IllegalArgumentException("Nội dung vượt quá " + maxLength + " ký tự");
        }
        return value;
    }

    private static Integer normalizeConfidence(Integer confidenceScore) {
        int value = confidenceScore == null ? 60 : confidenceScore;
        if (value < 0 || value > 100) {
            throw new IllegalArgumentException("Điểm tin cậy phải trong khoảng 0-100");
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

    public Long getReportId() {
        return reportId;
    }

    public PetDiagnosisSeverity getSeverity() {
        return severity;
    }

    public String getSummary() {
        return summary;
    }

    public String getLikelyDisease() {
        return likelyDisease;
    }

    public String getPossibleCauses() {
        return possibleCauses;
    }

    public String getDifferentialDiagnoses() {
        return differentialDiagnoses;
    }

    public String getRedFlags() {
        return redFlags;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public Boolean getShouldSeeVet() {
        return shouldSeeVet;
    }

    public Integer getConfidenceScore() {
        return confidenceScore;
    }

    public String getModelName() {
        return modelName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}