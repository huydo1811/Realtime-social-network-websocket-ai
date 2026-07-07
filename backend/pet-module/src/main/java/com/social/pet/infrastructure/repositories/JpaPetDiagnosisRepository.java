package com.social.pet.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.pet.domain.entities.PetDiagnosis;

public interface JpaPetDiagnosisRepository extends JpaRepository<PetDiagnosis, Long> {
    Optional<PetDiagnosis> findByReportId(Long reportId);

    List<PetDiagnosis> findByPetIdOrderByCreatedAtDesc(Long petId);
}