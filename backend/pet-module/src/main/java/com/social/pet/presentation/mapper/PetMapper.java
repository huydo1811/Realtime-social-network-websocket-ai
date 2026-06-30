package com.social.pet.presentation.mapper;

import org.springframework.stereotype.Component;

import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.entities.PetBreed;
import com.social.pet.presentation.dto.PetBreedResponse;
import com.social.pet.presentation.dto.PetResponse;
import com.social.user.domain.repositories.UserRepository;

@Component
public class PetMapper {
    private final UserRepository userRepository;

    public PetMapper(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public PetResponse toResponse(Pet pet) {
        PetResponse response = new PetResponse();
        response.setId(pet.getId());
        response.setOwnerUserId(pet.getOwnerUserId());
        userRepository.findById(pet.getOwnerUserId()).ifPresent(owner -> {
            response.setOwnerName(owner.getFullName());
        });
        response.setName(pet.getName());
        response.setSpecies(pet.getSpecies().name());
        response.setBreed(pet.getBreed());
        response.setGender(pet.getGender().name());
        response.setBirthDate(pet.getBirthDate());
        response.setWeightKg(pet.getWeightKg());
        response.setAvatarUrl(pet.getAvatarUrl());
        response.setBio(pet.getBio());
        response.setMicrochipCode(pet.getMicrochipCode());
        response.setStatus(pet.getStatus().name());
        response.setVisibility(pet.getVisibility().name());
        response.setCreatedAt(pet.getCreatedAt());
        response.setUpdatedAt(pet.getUpdatedAt());
        return response;
    }

    public PetBreedResponse toBreedResponse(PetBreed breed) {
        PetBreedResponse response = new PetBreedResponse();
        response.setId(breed.getId());
        response.setSpecies(breed.getSpecies().name());
        response.setName(breed.getName());
        return response;
    }
}
