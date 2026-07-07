package com.social.pet.infrastructure.repositories;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.pet.domain.entities.PetDiagnosis;
import com.social.pet.domain.repositories.PetDiagnosisRepository;

@Repository
public class PetDiagnosisRepositoryImpl implements PetDiagnosisRepository {
    private final JpaPetDiagnosisRepository jpaRepository;

    public PetDiagnosisRepositoryImpl(JpaPetDiagnosisRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PetDiagnosis save(PetDiagnosis diagnosis) {
        return jpaRepository.save(diagnosis);
    }

    @Override
    public Optional<PetDiagnosis> findById(Long id) {
        return jpaRepository.findById(Objects.requireNonNull(id));
    }

    @Override
    public Optional<PetDiagnosis> findByReportId(Long reportId) {
        return jpaRepository.findByReportId(Objects.requireNonNull(reportId));
    }

    @Override
    public List<PetDiagnosis> findByPetIdOrderByCreatedAtDesc(Long petId) {
        return jpaRepository.findByPetIdOrderByCreatedAtDesc(Objects.requireNonNull(petId));
    }
}