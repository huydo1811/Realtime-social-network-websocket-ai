package com.social.pet.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.pet.domain.entities.PetSymptomReport;

public interface JpaPetSymptomReportRepository extends JpaRepository<PetSymptomReport, Long> {
    List<PetSymptomReport> findByPetIdOrderByCreatedAtDesc(Long petId);
}