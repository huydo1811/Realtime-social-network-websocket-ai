package com.social.pet.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.pet.domain.entities.PetVisibility;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.entities.PetWalkSessionStatus;

public interface JpaPetWalkSessionRepository extends JpaRepository<PetWalkSession, Long> {
    List<PetWalkSession> findByPetIdOrderByStartedAtDesc(Long petId);

    List<PetWalkSession> findByStatusAndVisibilityOrderByStartedAtDesc(
            PetWalkSessionStatus status,
            PetVisibility visibility);
}