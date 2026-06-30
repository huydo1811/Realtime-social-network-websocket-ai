package com.social.pet.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.application.services.PetOwnerService;
import com.social.pet.domain.entities.PetHealthRecord;
import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.repositories.PetHealthRecordRepository;

@Service
public class DeletePetHealthRecordUseCase {
    private final PetOwnerService petOwnerService;
    private final PetHealthRecordRepository healthRecordRepository;

    public DeletePetHealthRecordUseCase(
            PetOwnerService petOwnerService,
            PetHealthRecordRepository healthRecordRepository) {
        this.petOwnerService = petOwnerService;
        this.healthRecordRepository = healthRecordRepository;
    }

    @Transactional
    public void execute(Long actorId, Long petId, Long recordId) {
        petOwnerService.requireOwnedPet(actorId, petId);
        PetHealthRecord record = healthRecordRepository.findById(recordId)
                .orElseThrow(() -> new PetDomainException("Không tìm thấy hồ sơ sức khỏe"));
        if (!record.getPetId().equals(petId)) {
            throw new PetDomainException("Hồ sơ không thuộc thú cưng này");
        }
        healthRecordRepository.delete(record);
    }
}
