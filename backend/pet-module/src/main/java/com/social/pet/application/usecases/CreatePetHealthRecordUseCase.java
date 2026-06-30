package com.social.pet.application.usecases;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.application.services.PetOwnerService;
import com.social.pet.domain.entities.PetHealthRecord;
import com.social.pet.domain.entities.PetHealthRecordType;
import com.social.pet.domain.repositories.PetHealthRecordRepository;

@Service
public class CreatePetHealthRecordUseCase {
    private final PetOwnerService petOwnerService;
    private final PetHealthRecordRepository healthRecordRepository;

    public CreatePetHealthRecordUseCase(
            PetOwnerService petOwnerService,
            PetHealthRecordRepository healthRecordRepository) {
        this.petOwnerService = petOwnerService;
        this.healthRecordRepository = healthRecordRepository;
    }

    @Transactional
    public PetHealthRecord execute(
            Long actorId,
            Long petId,
            PetHealthRecordType recordType,
            String title,
            String description,
            LocalDate performedAt,
            String clinicName,
            String documentUrl) {
        petOwnerService.requireOwnedPet(actorId, petId);
        PetHealthRecord record = PetHealthRecord.create(
                petId, actorId, recordType, title, description, performedAt, clinicName, documentUrl);
        return healthRecordRepository.save(record);
    }
}
