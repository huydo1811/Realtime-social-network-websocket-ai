package com.social.pet.application.usecases;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.application.services.PetOwnerService;
import com.social.pet.domain.entities.PetHealthRecordType;
import com.social.pet.domain.entities.PetHealthReminder;
import com.social.pet.domain.repositories.PetHealthReminderRepository;

@Service
public class CreatePetHealthReminderUseCase {
    private final PetOwnerService petOwnerService;
    private final PetHealthReminderRepository reminderRepository;

    public CreatePetHealthReminderUseCase(
            PetOwnerService petOwnerService,
            PetHealthReminderRepository reminderRepository) {
        this.petOwnerService = petOwnerService;
        this.reminderRepository = reminderRepository;
    }

    @Transactional
    public PetHealthReminder execute(
            Long actorId,
            Long petId,
            Long healthRecordId,
            String title,
            PetHealthRecordType reminderType,
            LocalDate dueDate,
            String note) {
        petOwnerService.requireOwnedPet(actorId, petId);
        PetHealthReminder reminder = PetHealthReminder.create(
                petId, actorId, healthRecordId, title, reminderType, dueDate, note);
        return reminderRepository.save(reminder);
    }
}
