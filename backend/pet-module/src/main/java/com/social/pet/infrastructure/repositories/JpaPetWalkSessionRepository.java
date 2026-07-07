package com.social.pet.infrastructure.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.social.pet.domain.entities.PetVisibility;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.entities.PetWalkSessionStatus;

public interface JpaPetWalkSessionRepository extends JpaRepository<PetWalkSession, Long> {
    List<PetWalkSession> findByPetIdOrderByStartedAtDesc(Long petId);

    List<PetWalkSession> findByStatusAndVisibilityOrderByStartedAtDesc(
            PetWalkSessionStatus status,
            PetVisibility visibility);

    Page<PetWalkSession> findAllByOrderByStartedAtDesc(Pageable pageable);

    @org.springframework.data.jpa.repository.Query("""
            SELECT w FROM PetWalkSession w
            JOIN Pet p ON p.id = w.petId
            WHERE p.ownerUserId = :ownerUserId
            """)
    Page<PetWalkSession> findByOwnerUserId(@org.springframework.data.repository.query.Param("ownerUserId") Long ownerUserId, Pageable pageable);
}