package com.social.pet.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.pet.domain.entities.PetWeightEntry;

public interface PetWeightEntryRepository {
    PetWeightEntry save(PetWeightEntry entry);

    Optional<PetWeightEntry> findById(Long id);

    List<PetWeightEntry> findByPetIdOrderByRecordedAtDesc(Long petId);

    void delete(PetWeightEntry entry);
}
