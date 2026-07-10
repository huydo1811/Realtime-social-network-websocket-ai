package com.social.pet.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.application.services.PetOwnerService;
import com.social.pet.domain.entities.PetHealthReminder;
import com.social.pet.domain.repositories.PetHealthReminderRepository;

@Service
public class ListPetHealthRemindersUseCase {
    private final PetOwnerService petOwnerService;
    private final PetHealthReminderRepository reminderRepository;

    public ListPetHealthRemindersUseCase(
            PetOwnerService petOwnerService,
            PetHealthReminderRepository reminderRepository) {
        this.petOwnerService = petOwnerService;
        this.reminderRepository = reminderRepository;
    }

    @Transactional(readOnly = true)
    public List<PetHealthReminder> execute(Long actorId, Long petId) {
        petOwnerService.requireOwnedPet(actorId, petId);
        return reminderRepository.findByPetIdOrderByDueDateDesc(petId);
    }
}
