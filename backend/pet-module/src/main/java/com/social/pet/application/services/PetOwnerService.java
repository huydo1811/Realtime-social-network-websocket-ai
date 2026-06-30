package com.social.pet.application.services;

import org.springframework.stereotype.Service;

import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.repositories.PetRepository;

@Service
public class PetOwnerService {
    private final PetRepository petRepository;

    public PetOwnerService(PetRepository petRepository) {
        this.petRepository = petRepository;
    }

    public Pet requireOwnedPet(Long actorId, Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new PetDomainException("Không tìm thấy thú cưng"));
        if (!pet.isOwner(actorId)) {
            throw new PetDomainException("Chỉ chủ nuôi mới có quyền quản lý sổ sức khỏe");
        }
        return pet;
    }
}
