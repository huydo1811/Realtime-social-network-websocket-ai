package com.social.pet.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.application.services.PetOwnerService;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.repositories.PetWalkSessionRepository;

@Service
public class FinishPetWalkSessionUseCase {
    private final PetOwnerService petOwnerService;
    private final PetWalkSessionRepository walkSessionRepository;

    public FinishPetWalkSessionUseCase(
            PetOwnerService petOwnerService,
            PetWalkSessionRepository walkSessionRepository) {
        this.petOwnerService = petOwnerService;
        this.walkSessionRepository = walkSessionRepository;
    }

    @Transactional
    public PetWalkSession execute(Long actorId, Long petId, Long walkId, Double endLatitude, Double endLongitude) {
        petOwnerService.requireOwnedPet(actorId, petId);
        PetWalkSession session = walkSessionRepository.findById(walkId)
                .orElseThrow(() -> new PetDomainException("Không tìm thấy phiên đi dạo"));
        if (!session.getPetId().equals(petId)) {
            throw new PetDomainException("Phiên đi dạo không thuộc thú cưng này");
        }
        session.finish(actorId, endLatitude, endLongitude);
        return walkSessionRepository.save(session);
    }
}