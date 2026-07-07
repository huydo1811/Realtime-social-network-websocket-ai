package com.social.pet.infrastructure.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.entities.PetSpecies;
import com.social.pet.domain.entities.PetStatus;

public interface JpaPetRepository extends JpaRepository<Pet, Long> {
    List<Pet> findByOwnerUserIdOrderByCreatedAtDesc(Long ownerUserId);

    Page<Pet> findByOwnerUserIdOrderByCreatedAtDesc(Long ownerUserId, Pageable pageable);

    Page<Pet> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Pet> findByNameContainingIgnoreCaseOrderByCreatedAtDesc(String name, Pageable pageable);

    long countByStatus(PetStatus status);

    List<Pet> findBySpecies(PetSpecies species);
}
