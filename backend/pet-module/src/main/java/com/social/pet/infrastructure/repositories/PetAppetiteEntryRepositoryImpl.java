package com.social.pet.infrastructure.repositories;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.pet.domain.entities.PetAppetiteEntry;
import com.social.pet.domain.repositories.PetAppetiteEntryRepository;

@Repository
public class PetAppetiteEntryRepositoryImpl implements PetAppetiteEntryRepository {
    private final JpaPetAppetiteEntryRepository jpaRepository;

    public PetAppetiteEntryRepositoryImpl(JpaPetAppetiteEntryRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PetAppetiteEntry save(PetAppetiteEntry entry) {
        return jpaRepository.save(entry);
    }

    @Override
    public Optional<PetAppetiteEntry> findById(Long id) {
        return jpaRepository.findById(Objects.requireNonNull(id));
    }

    @Override
    public List<PetAppetiteEntry> findByPetIdOrderByRecordedAtDesc(Long petId) {
        return jpaRepository.findByPetIdOrderByRecordedAtDesc(Objects.requireNonNull(petId));
    }

    @Override
    public void delete(PetAppetiteEntry entry) {
        jpaRepository.delete(entry);
    }
}
