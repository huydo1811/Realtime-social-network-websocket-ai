package com.social.pet.presentation.dto;

public class CreatePetAppetiteEntryRequest {
    private String level;
    private String note;

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
