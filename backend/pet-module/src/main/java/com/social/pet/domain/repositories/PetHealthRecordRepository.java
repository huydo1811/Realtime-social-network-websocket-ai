package com.social.pet.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.pet.domain.entities.PetHealthRecord;

public interface PetHealthRecordRepository {
    PetHealthRecord save(PetHealthRecord record);

    Optional<PetHealthRecord> findById(Long id);

    void delete(PetHealthRecord record);

    List<PetHealthRecord> findByPetIdOrderByPerformedAtDesc(Long petId);
}
