package com.social.pet.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.pet.domain.entities.PetAppetiteEntry;

public interface JpaPetAppetiteEntryRepository extends JpaRepository<PetAppetiteEntry, Long> {
    List<PetAppetiteEntry> findByPetIdOrderByRecordedAtDesc(Long petId);
}
