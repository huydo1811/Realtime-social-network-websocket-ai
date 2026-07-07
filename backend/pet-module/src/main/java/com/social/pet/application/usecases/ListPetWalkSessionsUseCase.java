package com.social.pet.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;

import com.social.pet.application.services.PetOwnerService;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.repositories.PetWalkSessionRepository;

@Service
public class ListPetWalkSessionsUseCase {
    private final PetOwnerService petOwnerService;
    private final PetWalkSessionRepository walkSessionRepository;

    public ListPetWalkSessionsUseCase(
            PetOwnerService petOwnerService,
            PetWalkSessionRepository walkSessionRepository) {
        this.petOwnerService = petOwnerService;
        this.walkSessionRepository = walkSessionRepository;
    }

    public List<PetWalkSession> execute(Long actorId, Long petId) {
        petOwnerService.requireOwnedPet(actorId, petId);
        return walkSessionRepository.findByPetIdOrderByStartedAtDesc(petId);
    }
}