package com.social.pet.domain.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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

    Page<PetWalkSession> findAll(Pageable pageable);

    Page<PetWalkSession> findByOwnerUserId(Long ownerUserId, Pageable pageable);

    long count();
}