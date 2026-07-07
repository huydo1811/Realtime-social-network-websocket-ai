package com.social.pet.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.social.pet.domain.entities.PetDiagnosis;

public interface JpaPetDiagnosisRepository extends JpaRepository<PetDiagnosis, Long> {
    Optional<PetDiagnosis> findByReportId(Long reportId);

    List<PetDiagnosis> findByPetIdOrderByCreatedAtDesc(Long petId);

    Page<PetDiagnosis> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @org.springframework.data.jpa.repository.Query("""
            SELECT d FROM PetDiagnosis d
            JOIN Pet p ON p.id = d.petId
            WHERE p.ownerUserId = :ownerUserId
            """)
    Page<PetDiagnosis> findByOwnerUserId(@org.springframework.data.repository.query.Param("ownerUserId") Long ownerUserId, Pageable pageable);
}