package com.social.pet.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.pet.domain.entities.PetSymptomReport;

public interface PetSymptomReportRepository {
    PetSymptomReport save(PetSymptomReport report);

    Optional<PetSymptomReport> findById(Long id);

    List<PetSymptomReport> findByPetIdOrderByCreatedAtDesc(Long petId);
}