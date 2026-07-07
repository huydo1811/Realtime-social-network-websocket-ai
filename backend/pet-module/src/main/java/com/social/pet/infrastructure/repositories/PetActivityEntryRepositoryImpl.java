package com.social.pet.infrastructure.repositories;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.pet.domain.entities.PetActivityEntry;
import com.social.pet.domain.repositories.PetActivityEntryRepository;

@Repository
public class PetActivityEntryRepositoryImpl implements PetActivityEntryRepository {
    private final JpaPetActivityEntryRepository jpaRepository;

    public PetActivityEntryRepositoryImpl(JpaPetActivityEntryRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PetActivityEntry save(PetActivityEntry entry) {
        return jpaRepository.save(entry);
    }

    @Override
    public Optional<PetActivityEntry> findById(Long id) {
        return jpaRepository.findById(Objects.requireNonNull(id));
    }

    @Override
    public List<PetActivityEntry> findByPetIdOrderByRecordedAtDesc(Long petId) {
        return jpaRepository.findByPetIdOrderByRecordedAtDesc(Objects.requireNonNull(petId));
    }

    @Override
    public void delete(PetActivityEntry entry) {
        jpaRepository.delete(entry);
    }
}
