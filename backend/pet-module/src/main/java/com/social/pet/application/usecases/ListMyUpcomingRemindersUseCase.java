package com.social.pet.application.usecases;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.entities.PetHealthReminder;
import com.social.pet.domain.entities.PetReminderStatus;
import com.social.pet.domain.repositories.PetHealthReminderRepository;

@Service
public class ListMyUpcomingRemindersUseCase {
    private final PetHealthReminderRepository reminderRepository;

    public ListMyUpcomingRemindersUseCase(PetHealthReminderRepository reminderRepository) {
        this.reminderRepository = reminderRepository;
    }

    @Transactional(readOnly = true)
    public List<PetHealthReminder> execute(Long actorId) {
        return reminderRepository.findUpcomingByOwnerUserId(actorId, LocalDate.now(), PetReminderStatus.PENDING);
    }
}
