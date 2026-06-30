package com.social.pet.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.pet.domain.entities.PetHealthRecord;

public interface JpaPetHealthRecordRepository extends JpaRepository<PetHealthRecord, Long> {
    List<PetHealthRecord> findByPetIdOrderByPerformedAtDesc(Long petId);
}
