package com.social.pet.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.pet.domain.entities.PetActivityEntry;

public interface PetActivityEntryRepository {
    PetActivityEntry save(PetActivityEntry entry);

    Optional<PetActivityEntry> findById(Long id);

    List<PetActivityEntry> findByPetIdOrderByRecordedAtDesc(Long petId);

    void delete(PetActivityEntry entry);
}
