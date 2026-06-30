package com.social.pet.domain.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.entities.PetSpecies;

public interface PetRepository {
    Pet save(Pet pet);

    Optional<Pet> findById(Long id);

    void delete(Pet pet);

    List<Pet> findByOwnerUserId(Long ownerUserId);

    Page<Pet> findByOwnerUserId(Long ownerUserId, Pageable pageable);
}
