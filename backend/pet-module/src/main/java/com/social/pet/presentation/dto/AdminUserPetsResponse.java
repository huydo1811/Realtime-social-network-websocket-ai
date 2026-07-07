package com.social.pet.presentation.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AdminUserPetsResponse {
    private Long userId;
    private String fullName;
    private String username;
    private String avatarUrl;
    private int totalPets;
    private int activePets;
    private int pendingReminders;
    private List<PetResponse> pets;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public int getTotalPets() { return totalPets; }
    public void setTotalPets(int totalPets) { this.totalPets = totalPets; }
    public int getActivePets() { return activePets; }
    public void setActivePets(int activePets) { this.activePets = activePets; }
    public int getPendingReminders() { return pendingReminders; }
    public void setPendingReminders(int pendingReminders) { this.pendingReminders = pendingReminders; }
    public List<PetResponse> getPets() { return pets; }
    public void setPets(List<PetResponse> pets) { this.pets = pets; }
}
