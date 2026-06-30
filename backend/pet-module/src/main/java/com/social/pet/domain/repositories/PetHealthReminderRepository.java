package com.social.pet.domain.repositories;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.social.pet.domain.entities.PetHealthReminder;
import com.social.pet.domain.entities.PetReminderStatus;

public interface PetHealthReminderRepository {
    PetHealthReminder save(PetHealthReminder reminder);

    Optional<PetHealthReminder> findById(Long id);

    void delete(PetHealthReminder reminder);

    List<PetHealthReminder> findByPetIdAndStatusOrderByDueDateAsc(Long petId, PetReminderStatus status);

    List<PetHealthReminder> findUpcomingByOwnerUserId(Long ownerUserId, LocalDate fromDate, PetReminderStatus status);

    List<PetHealthReminder> findDueByOwnerUserId(Long ownerUserId, LocalDate today, PetReminderStatus status);
}
