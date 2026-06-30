package com.social.pet.domain.repositories;

import java.util.List;

import com.social.pet.domain.entities.PetBreed;
import com.social.pet.domain.entities.PetSpecies;

public interface PetBreedRepository {
    List<PetBreed> findBySpecies(PetSpecies species);

    List<PetBreed> findAll();
}
