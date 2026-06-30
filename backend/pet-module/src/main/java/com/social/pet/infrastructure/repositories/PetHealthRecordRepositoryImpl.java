package com.social.pet.infrastructure.repositories;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.pet.domain.entities.PetHealthRecord;
import com.social.pet.domain.repositories.PetHealthRecordRepository;

@Repository
public class PetHealthRecordRepositoryImpl implements PetHealthRecordRepository {
    private final JpaPetHealthRecordRepository jpaRepository;

    public PetHealthRecordRepositoryImpl(JpaPetHealthRecordRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PetHealthRecord save(PetHealthRecord record) {
        return jpaRepository.save(record);
    }

    @Override
    public Optional<PetHealthRecord> findById(Long id) {
        return jpaRepository.findById(Objects.requireNonNull(id));
    }

    @Override
    public void delete(PetHealthRecord record) {
        jpaRepository.delete(record);
    }

    @Override
    public List<PetHealthRecord> findByPetIdOrderByPerformedAtDesc(Long petId) {
        return jpaRepository.findByPetIdOrderByPerformedAtDesc(petId);
    }
}
