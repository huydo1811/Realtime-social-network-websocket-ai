package com.social.pet.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.entities.PetBreed;
import com.social.pet.domain.entities.PetSpecies;
import com.social.pet.domain.repositories.PetBreedRepository;

@Service
public class ListPetBreedsUseCase {
    private final PetBreedRepository petBreedRepository;

    public ListPetBreedsUseCase(PetBreedRepository petBreedRepository) {
        this.petBreedRepository = petBreedRepository;
    }

    @Transactional(readOnly = true)
    public List<PetBreed> execute(PetSpecies species) {
        if (species == null) {
            return petBreedRepository.findAll();
        }
        return petBreedRepository.findBySpecies(species);
    }
}
