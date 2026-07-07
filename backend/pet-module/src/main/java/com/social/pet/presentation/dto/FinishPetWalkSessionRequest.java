package com.social.pet.presentation.dto;

import jakarta.validation.constraints.NotNull;

public class FinishPetWalkSessionRequest {
    @NotNull(message = "Vĩ độ kết thúc không được để trống")
    private Double endLatitude;

    @NotNull(message = "Kinh độ kết thúc không được để trống")
    private Double endLongitude;

    public Double getEndLatitude() {
        return endLatitude;
    }

    public void setEndLatitude(Double endLatitude) {
        this.endLatitude = endLatitude;
    }

    public Double getEndLongitude() {
        return endLongitude;
    }

    public void setEndLongitude(Double endLongitude) {
        this.endLongitude = endLongitude;
    }
}