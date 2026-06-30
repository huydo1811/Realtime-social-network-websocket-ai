package com.social.post.application.services;

import org.springframework.stereotype.Service;

import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.repositories.PetRepository;

@Service
public class PostPetValidator {
    private final PetRepository petRepository;

    public PostPetValidator(PetRepository petRepository) {
        this.petRepository = petRepository;
    }

    public void validateOwnership(Long actorId, Long petId) {
        if (petId == null) {
            return;
        }
        var pet = petRepository.findById(petId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thú cưng"));
        if (!pet.isOwner(actorId)) {
            throw new IllegalArgumentException("Thú cưng không thuộc về bạn");
        }
    }

    public void ensurePetExists(Long petId) {
        if (petId == null) {
            throw new PetDomainException("Không tìm thấy thú cưng");
        }
        petRepository.findById(petId)
                .orElseThrow(() -> new PetDomainException("Không tìm thấy thú cưng"));
    }
}
