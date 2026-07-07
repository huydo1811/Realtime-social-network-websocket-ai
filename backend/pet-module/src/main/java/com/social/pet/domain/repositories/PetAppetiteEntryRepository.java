package com.social.pet.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.pet.domain.entities.PetAppetiteEntry;

public interface PetAppetiteEntryRepository {
    PetAppetiteEntry save(PetAppetiteEntry entry);

    Optional<PetAppetiteEntry> findById(Long id);

    List<PetAppetiteEntry> findByPetIdOrderByRecordedAtDesc(Long petId);

    void delete(PetAppetiteEntry entry);
}
