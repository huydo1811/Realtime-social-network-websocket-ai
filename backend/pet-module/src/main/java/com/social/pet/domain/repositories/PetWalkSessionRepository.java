package com.social.pet.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.pet.domain.entities.PetVisibility;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.entities.PetWalkSessionStatus;

public interface PetWalkSessionRepository {
    PetWalkSession save(PetWalkSession session);

    Optional<PetWalkSession> findById(Long id);

    List<PetWalkSession> findByPetIdOrderByStartedAtDesc(Long petId);

    List<PetWalkSession> findByStatusAndVisibilityOrderByStartedAtDesc(
            PetWalkSessionStatus status,
            PetVisibility visibility);
}