package com.social.pet.presentation.dto;

import java.time.LocalDateTime;

public class AdminPetStatsResponse {
    private long totalPets;
    private long totalActivePets;
    private long totalWalkSessions;
    private long totalDiagnoses;
    private long pendingReminders;
    private long overdueReminders;
    private LocalDateTime generatedAt;

    public AdminPetStatsResponse() {}

    public AdminPetStatsResponse(long totalPets, long totalActivePets, long totalWalkSessions,
            long totalDiagnoses, long pendingReminders, long overdueReminders) {
        this.totalPets = totalPets;
        this.totalActivePets = totalActivePets;
        this.totalWalkSessions = totalWalkSessions;
        this.totalDiagnoses = totalDiagnoses;
        this.pendingReminders = pendingReminders;
        this.overdueReminders = overdueReminders;
        this.generatedAt = LocalDateTime.now();
    }

    public long getTotalPets() { return totalPets; }
    public void setTotalPets(long totalPets) { this.totalPets = totalPets; }
    public long getTotalActivePets() { return totalActivePets; }
    public void setTotalActivePets(long totalActivePets) { this.totalActivePets = totalActivePets; }
    public long getTotalWalkSessions() { return totalWalkSessions; }
    public void setTotalWalkSessions(long totalWalkSessions) { this.totalWalkSessions = totalWalkSessions; }
    public long getTotalDiagnoses() { return totalDiagnoses; }
    public void setTotalDiagnoses(long totalDiagnoses) { this.totalDiagnoses = totalDiagnoses; }
    public long getPendingReminders() { return pendingReminders; }
    public void setPendingReminders(long pendingReminders) { this.pendingReminders = pendingReminders; }
    public long getOverdueReminders() { return overdueReminders; }
    public void setOverdueReminders(long overdueReminders) { this.overdueReminders = overdueReminders; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}
