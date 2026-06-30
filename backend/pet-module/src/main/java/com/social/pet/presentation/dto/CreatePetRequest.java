package com.social.pet.presentation.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.social.pet.domain.entities.PetGender;
import com.social.pet.domain.entities.PetSpecies;
import com.social.pet.domain.entities.PetVisibility;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreatePetRequest {
    @NotBlank(message = "Tên thú cưng không được để trống")
    @Size(max = 100, message = "Tên thú cưng vượt quá 100 ký tự")
    private String name;

    @NotNull(message = "Loài thú cưng không được để trống")
    private PetSpecies species;

    @Size(max = 100, message = "Giống vượt quá 100 ký tự")
    private String breed;

    private PetGender gender;

    private LocalDate birthDate;

    private BigDecimal weightKg;

    @Size(max = 2048, message = "avatarUrl vượt quá 2048 ký tự")
    private String avatarUrl;

    @Size(max = 2000, message = "Bio vượt quá 2000 ký tự")
    private String bio;

    @Size(max = 64, message = "Mã microchip vượt quá 64 ký tự")
    private String microchipCode;

    private PetVisibility visibility;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public PetSpecies getSpecies() {
        return species;
    }

    public void setSpecies(PetSpecies species) {
        this.species = species;
    }

    public String getBreed() {
        return breed;
    }

    public void setBreed(String breed) {
        this.breed = breed;
    }

    public PetGender getGender() {
        return gender;
    }

    public void setGender(PetGender gender) {
        this.gender = gender;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public BigDecimal getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(BigDecimal weightKg) {
        this.weightKg = weightKg;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getMicrochipCode() {
        return microchipCode;
    }

    public void setMicrochipCode(String microchipCode) {
        this.microchipCode = microchipCode;
    }

    public PetVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(PetVisibility visibility) {
        this.visibility = visibility;
    }
}
