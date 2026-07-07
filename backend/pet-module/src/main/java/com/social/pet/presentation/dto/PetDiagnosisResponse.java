package com.social.pet.presentation.dto;

import java.time.LocalDateTime;

public class PetDiagnosisResponse {
    private Long id;
    private Long petId;
    private String petName;
    private Long reportId;
    private String symptomsText;
    private Double temperatureC;
    private Integer durationHours;
    private Boolean appetiteLoss;
    private Boolean energyDrop;
    private Boolean vomiting;
    private Boolean diarrhea;
    private Boolean cough;
    private Boolean breathingDifficulty;
    private Boolean skinRash;
    private String severity;
    private String summary;
    private String likelyDisease;
    private String possibleCauses;
    private String differentialDiagnoses;
    private String redFlags;
    private String recommendation;
    private Boolean shouldSeeVet;
    private Integer confidenceScore;
    private String modelName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPetId() {
        return petId;
    }

    public void setPetId(Long petId) {
        this.petId = petId;
    }

    public String getPetName() {
        return petName;
    }

    public void setPetName(String petName) {
        this.petName = petName;
    }

    public Long getReportId() {
        return reportId;
    }

    public void setReportId(Long reportId) {
        this.reportId = reportId;
    }

    public String getSymptomsText() {
        return symptomsText;
    }

    public void setSymptomsText(String symptomsText) {
        this.symptomsText = symptomsText;
    }

    public Double getTemperatureC() {
        return temperatureC;
    }

    public void setTemperatureC(Double temperatureC) {
        this.temperatureC = temperatureC;
    }

    public Integer getDurationHours() {
        return durationHours;
    }

    public void setDurationHours(Integer durationHours) {
        this.durationHours = durationHours;
    }

    public Boolean getAppetiteLoss() {
        return appetiteLoss;
    }

    public void setAppetiteLoss(Boolean appetiteLoss) {
        this.appetiteLoss = appetiteLoss;
    }

    public Boolean getEnergyDrop() {
        return energyDrop;
    }

    public void setEnergyDrop(Boolean energyDrop) {
        this.energyDrop = energyDrop;
    }

    public Boolean getVomiting() {
        return vomiting;
    }

    public void setVomiting(Boolean vomiting) {
        this.vomiting = vomiting;
    }

    public Boolean getDiarrhea() {
        return diarrhea;
    }

    public void setDiarrhea(Boolean diarrhea) {
        this.diarrhea = diarrhea;
    }

    public Boolean getCough() {
        return cough;
    }

    public void setCough(Boolean cough) {
        this.cough = cough;
    }

    public Boolean getBreathingDifficulty() {
        return breathingDifficulty;
    }

    public void setBreathingDifficulty(Boolean breathingDifficulty) {
        this.breathingDifficulty = breathingDifficulty;
    }

    public Boolean getSkinRash() {
        return skinRash;
    }

    public void setSkinRash(Boolean skinRash) {
        this.skinRash = skinRash;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getLikelyDisease() {
        return likelyDisease;
    }

    public void setLikelyDisease(String likelyDisease) {
        this.likelyDisease = likelyDisease;
    }

    public String getPossibleCauses() {
        return possibleCauses;
    }

    public void setPossibleCauses(String possibleCauses) {
        this.possibleCauses = possibleCauses;
    }

    public String getDifferentialDiagnoses() {
        return differentialDiagnoses;
    }

    public void setDifferentialDiagnoses(String differentialDiagnoses) {
        this.differentialDiagnoses = differentialDiagnoses;
    }

    public String getRedFlags() {
        return redFlags;
    }

    public void setRedFlags(String redFlags) {
        this.redFlags = redFlags;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public Boolean getShouldSeeVet() {
        return shouldSeeVet;
    }

    public void setShouldSeeVet(Boolean shouldSeeVet) {
        this.shouldSeeVet = shouldSeeVet;
    }

    public Integer getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Integer confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}