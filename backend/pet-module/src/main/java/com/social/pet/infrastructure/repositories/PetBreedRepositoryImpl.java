package com.social.pet.infrastructure.repositories;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.social.pet.domain.entities.PetBreed;
import com.social.pet.domain.entities.PetSpecies;
import com.social.pet.domain.repositories.PetBreedRepository;

@Repository
public class PetBreedRepositoryImpl implements PetBreedRepository {
    private final JpaPetBreedRepository jpaPetBreedRepository;

    public PetBreedRepositoryImpl(JpaPetBreedRepository jpaPetBreedRepository) {
        this.jpaPetBreedRepository = jpaPetBreedRepository;
    }

    @Override
    public List<PetBreed> findBySpecies(PetSpecies species) {
        return jpaPetBreedRepository.findBySpeciesOrderByNameAsc(species);
    }

    @Override
    public List<PetBreed> findAll() {
        return jpaPetBreedRepository.findAll();
    }
}
