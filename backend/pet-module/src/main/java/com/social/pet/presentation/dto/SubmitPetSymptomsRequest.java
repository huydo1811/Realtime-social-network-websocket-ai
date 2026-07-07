package com.social.pet.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SubmitPetSymptomsRequest {
    @NotBlank(message = "Mô tả triệu chứng không được để trống")
    @Size(max = 4000, message = "Mô tả triệu chứng vượt quá 4000 ký tự")
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
}