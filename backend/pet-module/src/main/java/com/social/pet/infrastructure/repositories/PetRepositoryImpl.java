package com.social.pet.infrastructure.repositories;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.repositories.PetRepository;

@Repository
public class PetRepositoryImpl implements PetRepository {
    private final JpaPetRepository jpaPetRepository;

    public PetRepositoryImpl(JpaPetRepository jpaPetRepository) {
        this.jpaPetRepository = jpaPetRepository;
    }

    @Override
    public Pet save(Pet pet) {
        return jpaPetRepository.save(pet);
    }

    @Override
    public Optional<Pet> findById(Long id) {
        return jpaPetRepository.findById(Objects.requireNonNull(id));
    }

    @Override
    public void delete(Pet pet) {
        jpaPetRepository.delete(pet);
    }

    @Override
    public List<Pet> findByOwnerUserId(Long ownerUserId) {
        return jpaPetRepository.findByOwnerUserIdOrderByCreatedAtDesc(ownerUserId);
    }

    @Override
    public Page<Pet> findByOwnerUserId(Long ownerUserId, Pageable pageable) {
        return jpaPetRepository.findByOwnerUserIdOrderByCreatedAtDesc(
                ownerUserId, Objects.requireNonNull(pageable));
    }
}
