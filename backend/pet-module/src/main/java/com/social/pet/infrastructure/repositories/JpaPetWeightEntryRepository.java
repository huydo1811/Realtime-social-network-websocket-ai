package com.social.pet.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.pet.domain.entities.PetWeightEntry;

public interface JpaPetWeightEntryRepository extends JpaRepository<PetWeightEntry, Long> {
    List<PetWeightEntry> findByPetIdOrderByRecordedAtDesc(Long petId);
}
