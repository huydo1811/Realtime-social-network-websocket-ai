package com.social.pet.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.pet.domain.entities.PetActivityEntry;

public interface JpaPetActivityEntryRepository extends JpaRepository<PetActivityEntry, Long> {
    List<PetActivityEntry> findByPetIdOrderByRecordedAtDesc(Long petId);
}
