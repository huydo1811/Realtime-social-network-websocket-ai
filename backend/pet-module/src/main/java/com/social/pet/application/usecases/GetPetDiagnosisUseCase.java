package com.social.pet.application.usecases;

import org.springframework.stereotype.Service;

import com.social.pet.application.services.PetOwnerService;
import com.social.pet.domain.entities.PetDiagnosis;
import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.repositories.PetDiagnosisRepository;

@Service
public class GetPetDiagnosisUseCase {
    private final PetOwnerService petOwnerService;
    private final PetDiagnosisRepository diagnosisRepository;

    public GetPetDiagnosisUseCase(PetOwnerService petOwnerService, PetDiagnosisRepository diagnosisRepository) {
        this.petOwnerService = petOwnerService;
        this.diagnosisRepository = diagnosisRepository;
    }

    public PetDiagnosis execute(Long actorId, Long petId, Long diagnosisId) {
        petOwnerService.requireOwnedPet(actorId, petId);
        PetDiagnosis diagnosis = diagnosisRepository.findById(diagnosisId)
                .orElseThrow(() -> new PetDomainException("Không tìm thấy chẩn đoán"));
        if (!diagnosis.getPetId().equals(petId)) {
            throw new PetDomainException("Chẩn đoán không thuộc thú cưng này");
        }
        return diagnosis;
    }
}