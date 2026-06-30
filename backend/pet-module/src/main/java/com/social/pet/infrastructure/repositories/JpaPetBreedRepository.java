package com.social.pet.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.pet.domain.entities.PetBreed;
import com.social.pet.domain.entities.PetSpecies;

public interface JpaPetBreedRepository extends JpaRepository<PetBreed, Long> {
    List<PetBreed> findBySpeciesOrderByNameAsc(PetSpecies species);
}
