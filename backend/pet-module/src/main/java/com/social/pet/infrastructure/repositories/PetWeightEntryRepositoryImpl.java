package com.social.pet.infrastructure.repositories;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.pet.domain.entities.PetWeightEntry;
import com.social.pet.domain.repositories.PetWeightEntryRepository;

@Repository
public class PetWeightEntryRepositoryImpl implements PetWeightEntryRepository {
    private final JpaPetWeightEntryRepository jpaRepository;

    public PetWeightEntryRepositoryImpl(JpaPetWeightEntryRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PetWeightEntry save(PetWeightEntry entry) {
        return jpaRepository.save(entry);
    }

    @Override
    public Optional<PetWeightEntry> findById(Long id) {
        return jpaRepository.findById(Objects.requireNonNull(id));
    }

    @Override
    public List<PetWeightEntry> findByPetIdOrderByRecordedAtDesc(Long petId) {
        return jpaRepository.findByPetIdOrderByRecordedAtDesc(Objects.requireNonNull(petId));
    }

    @Override
    public void delete(PetWeightEntry entry) {
        jpaRepository.delete(entry);
    }
}
