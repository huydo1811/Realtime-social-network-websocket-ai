package com.social.pet.presentation.dto;

import com.social.pet.domain.entities.PetVisibility;

import jakarta.validation.constraints.NotNull;

public class CreatePetWalkSessionRequest {
    @NotNull(message = "Vĩ độ không được để trống")
    private Double startLatitude;

    @NotNull(message = "Kinh độ không được để trống")
    private Double startLongitude;

    private PetVisibility visibility = PetVisibility.PUBLIC;

    private String routeName;

    private String note;

    public Double getStartLatitude() {
        return startLatitude;
    }

    public void setStartLatitude(Double startLatitude) {
        this.startLatitude = startLatitude;
    }

    public Double getStartLongitude() {
        return startLongitude;
    }

    public void setStartLongitude(Double startLongitude) {
        this.startLongitude = startLongitude;
    }

    public PetVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(PetVisibility visibility) {
        this.visibility = visibility;
    }

    public String getRouteName() {
        return routeName;
    }

    public void setRouteName(String routeName) {
        this.routeName = routeName;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}