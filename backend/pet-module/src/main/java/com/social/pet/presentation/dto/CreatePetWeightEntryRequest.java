package com.social.pet.presentation.dto;

import java.math.BigDecimal;

public class CreatePetWeightEntryRequest {
    private BigDecimal weightKg;
    private String note;

    public BigDecimal getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(BigDecimal weightKg) {
        this.weightKg = weightKg;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
