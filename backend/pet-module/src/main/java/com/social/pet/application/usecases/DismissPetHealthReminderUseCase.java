package com.social.pet.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.application.services.PetOwnerService;
import com.social.pet.domain.entities.PetHealthReminder;
import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.repositories.PetHealthReminderRepository;

@Service
public class DismissPetHealthReminderUseCase {
    private final PetOwnerService petOwnerService;
    private final PetHealthReminderRepository reminderRepository;

    public DismissPetHealthReminderUseCase(
            PetOwnerService petOwnerService,
            PetHealthReminderRepository reminderRepository) {
        this.petOwnerService = petOwnerService;
        this.reminderRepository = reminderRepository;
    }

    @Transactional
    public PetHealthReminder execute(Long actorId, Long petId, Long reminderId) {
        petOwnerService.requireOwnedPet(actorId, petId);
        PetHealthReminder reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new PetDomainException("Không tìm thấy nhắc nhở"));
        if (!reminder.getPetId().equals(petId)) {
            throw new PetDomainException("Nhắc nhở không thuộc thú cưng này");
        }
        reminder.dismiss();
        return reminderRepository.save(reminder);
    }
}
