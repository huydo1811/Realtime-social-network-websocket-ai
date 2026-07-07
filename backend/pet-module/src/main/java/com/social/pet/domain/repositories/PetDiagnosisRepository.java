package com.social.pet.domain.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.social.pet.domain.entities.PetDiagnosis;

public interface PetDiagnosisRepository {
    PetDiagnosis save(PetDiagnosis diagnosis);

    Optional<PetDiagnosis> findById(Long id);

    Optional<PetDiagnosis> findByReportId(Long reportId);

    List<PetDiagnosis> findByPetIdOrderByCreatedAtDesc(Long petId);

    Page<PetDiagnosis> findAll(Pageable pageable);

    Page<PetDiagnosis> findByOwnerUserId(Long ownerUserId, Pageable pageable);

    long count();
}