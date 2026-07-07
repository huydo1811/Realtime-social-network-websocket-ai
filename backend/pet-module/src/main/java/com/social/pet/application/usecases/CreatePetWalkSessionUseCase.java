package com.social.pet.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.application.services.PetOwnerService;
import com.social.pet.domain.entities.PetVisibility;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.repositories.PetWalkSessionRepository;

@Service
public class CreatePetWalkSessionUseCase {
    private final PetOwnerService petOwnerService;
    private final PetWalkSessionRepository walkSessionRepository;

    public CreatePetWalkSessionUseCase(
            PetOwnerService petOwnerService,
            PetWalkSessionRepository walkSessionRepository) {
        this.petOwnerService = petOwnerService;
        this.walkSessionRepository = walkSessionRepository;
    }

    @Transactional
    public PetWalkSession execute(
            Long actorId,
            Long petId,
            PetVisibility visibility,
            Double startLatitude,
            Double startLongitude,
            String routeName,
            String note) {
        petOwnerService.requireOwnedPet(actorId, petId);
        PetWalkSession session = PetWalkSession.create(
                petId,
                actorId,
                visibility,
                startLatitude,
                startLongitude,
                routeName,
                note);
        return walkSessionRepository.save(session);
    }
}