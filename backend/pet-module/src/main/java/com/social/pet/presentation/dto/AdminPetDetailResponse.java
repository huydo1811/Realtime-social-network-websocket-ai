package com.social.pet.presentation.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class AdminPetDetailResponse {
    private PetResponse pet;
    private List<PetHealthRecordResponse> healthRecords;
    private List<PetHealthReminderResponse> reminders;
    private List<PetDiagnosisResponse> recentDiagnoses;
    private List<PetWalkSessionResponse> recentWalks;
    private LocalDateTime fetchedAt;

    public AdminPetDetailResponse() { this.fetchedAt = LocalDateTime.now(); }

    public PetResponse getPet() { return pet; }
    public void setPet(PetResponse pet) { this.pet = pet; }
    public List<PetHealthRecordResponse> getHealthRecords() { return healthRecords; }
    public void setHealthRecords(List<PetHealthRecordResponse> healthRecords) { this.healthRecords = healthRecords; }
    public List<PetHealthReminderResponse> getReminders() { return reminders; }
    public void setReminders(List<PetHealthReminderResponse> reminders) { this.reminders = reminders; }
    public List<PetDiagnosisResponse> getRecentDiagnoses() { return recentDiagnoses; }
    public void setRecentDiagnoses(List<PetDiagnosisResponse> recentDiagnoses) { this.recentDiagnoses = recentDiagnoses; }
    public List<PetWalkSessionResponse> getRecentWalks() { return recentWalks; }
    public void setRecentWalks(List<PetWalkSessionResponse> recentWalks) { this.recentWalks = recentWalks; }
    public LocalDateTime getFetchedAt() { return fetchedAt; }
    public void setFetchedAt(LocalDateTime fetchedAt) { this.fetchedAt = fetchedAt; }
}
