package com.social.pet.infrastructure.repositories;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.pet.domain.entities.PetSymptomReport;
import com.social.pet.domain.repositories.PetSymptomReportRepository;

@Repository
public class PetSymptomReportRepositoryImpl implements PetSymptomReportRepository {
    private final JpaPetSymptomReportRepository jpaRepository;

    public PetSymptomReportRepositoryImpl(JpaPetSymptomReportRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PetSymptomReport save(PetSymptomReport report) {
        return jpaRepository.save(report);
    }

    @Override
    public Optional<PetSymptomReport> findById(Long id) {
        return jpaRepository.findById(Objects.requireNonNull(id));
    }

    @Override
    public List<PetSymptomReport> findByPetIdOrderByCreatedAtDesc(Long petId) {
        return jpaRepository.findByPetIdOrderByCreatedAtDesc(Objects.requireNonNull(petId));
    }
}