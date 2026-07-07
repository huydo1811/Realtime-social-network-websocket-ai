package com.social.pet.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;

import com.social.pet.application.services.PetOwnerService;
import com.social.pet.domain.entities.PetDiagnosis;
import com.social.pet.domain.repositories.PetDiagnosisRepository;

@Service
public class ListPetDiagnosesUseCase {
    private final PetOwnerService petOwnerService;
    private final PetDiagnosisRepository diagnosisRepository;

    public ListPetDiagnosesUseCase(PetOwnerService petOwnerService, PetDiagnosisRepository diagnosisRepository) {
        this.petOwnerService = petOwnerService;
        this.diagnosisRepository = diagnosisRepository;
    }

    public List<PetDiagnosis> execute(Long actorId, Long petId) {
        petOwnerService.requireOwnedPet(actorId, petId);
        return diagnosisRepository.findByPetIdOrderByCreatedAtDesc(petId);
    }
}