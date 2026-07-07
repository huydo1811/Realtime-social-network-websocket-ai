package com.social.pet.presentation.dto;

import java.time.LocalDateTime;

public class PetWalkMeetupRequestResponse {
    private Long id;
    private Long walkSessionId;
    private Long petId;
    private String petName;
    private Long requesterUserId;
    private String requesterName;
    private String message;
    private Double meetupLatitude;
    private Double meetupLongitude;
    private String status;
    private Long respondedByUserId;
    private LocalDateTime respondedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getWalkSessionId() {
        return walkSessionId;
    }

    public void setWalkSessionId(Long walkSessionId) {
        this.walkSessionId = walkSessionId;
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

    public Long getRequesterUserId() {
        return requesterUserId;
    }

    public void setRequesterUserId(Long requesterUserId) {
        this.requesterUserId = requesterUserId;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public void setRequesterName(String requesterName) {
        this.requesterName = requesterName;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Double getMeetupLatitude() {
        return meetupLatitude;
    }

    public void setMeetupLatitude(Double meetupLatitude) {
        this.meetupLatitude = meetupLatitude;
    }

    public Double getMeetupLongitude() {
        return meetupLongitude;
    }

    public void setMeetupLongitude(Double meetupLongitude) {
        this.meetupLongitude = meetupLongitude;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getRespondedByUserId() {
        return respondedByUserId;
    }

    public void setRespondedByUserId(Long respondedByUserId) {
        this.respondedByUserId = respondedByUserId;
    }

    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(LocalDateTime respondedAt) {
        this.respondedAt = respondedAt;
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