package com.social.pet.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.application.services.PetOwnerService;
import com.social.pet.domain.entities.PetHealthRecord;
import com.social.pet.domain.repositories.PetHealthRecordRepository;

@Service
public class ListPetHealthRecordsUseCase {
    private final PetOwnerService petOwnerService;
    private final PetHealthRecordRepository healthRecordRepository;

    public ListPetHealthRecordsUseCase(
            PetOwnerService petOwnerService,
            PetHealthRecordRepository healthRecordRepository) {
        this.petOwnerService = petOwnerService;
        this.healthRecordRepository = healthRecordRepository;
    }

    @Transactional(readOnly = true)
    public List<PetHealthRecord> execute(Long actorId, Long petId) {
        petOwnerService.requireOwnedPet(actorId, petId);
        return healthRecordRepository.findByPetIdOrderByPerformedAtDesc(petId);
    }
}
