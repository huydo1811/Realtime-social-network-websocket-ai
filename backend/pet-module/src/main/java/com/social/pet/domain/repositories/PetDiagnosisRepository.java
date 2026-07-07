package com.social.pet.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.pet.domain.entities.PetDiagnosis;

public interface PetDiagnosisRepository {
    PetDiagnosis save(PetDiagnosis diagnosis);

    Optional<PetDiagnosis> findById(Long id);

    Optional<PetDiagnosis> findByReportId(Long reportId);

    List<PetDiagnosis> findByPetIdOrderByCreatedAtDesc(Long petId);
}