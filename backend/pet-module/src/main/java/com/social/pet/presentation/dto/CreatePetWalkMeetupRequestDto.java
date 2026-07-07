package com.social.pet.presentation.dto;

import jakarta.validation.constraints.Size;

public class CreatePetWalkMeetupRequestDto {
    @Size(max = 1000, message = "Tin nhắn vượt quá 1000 ký tự")
    private String message;

    private Double meetupLatitude;

    private Double meetupLongitude;

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
}