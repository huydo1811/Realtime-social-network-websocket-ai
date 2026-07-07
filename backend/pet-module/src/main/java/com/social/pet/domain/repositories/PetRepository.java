package com.social.pet.domain.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.entities.PetSpecies;
import com.social.pet.domain.entities.PetStatus;

public interface PetRepository {
    Pet save(Pet pet);

    Optional<Pet> findById(Long id);

    void delete(Pet pet);

    List<Pet> findByOwnerUserId(Long ownerUserId);

    Page<Pet> findByOwnerUserId(Long ownerUserId, Pageable pageable);

    Page<Pet> findAll(Pageable pageable);

    List<Pet> findByNameContainingIgnoreCase(String name);

    Page<Pet> findByNameContainingIgnoreCase(String name, Pageable pageable);

    List<Pet> findBySpecies(PetSpecies species);

    long count();

    long countByStatus(PetStatus status);
}
