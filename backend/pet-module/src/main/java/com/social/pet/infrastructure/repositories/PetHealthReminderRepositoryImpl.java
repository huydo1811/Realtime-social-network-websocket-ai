package com.social.pet.infrastructure.repositories;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.pet.domain.entities.PetHealthReminder;
import com.social.pet.domain.entities.PetReminderStatus;
import com.social.pet.domain.repositories.PetHealthReminderRepository;

@Repository
public class PetHealthReminderRepositoryImpl implements PetHealthReminderRepository {
    private final JpaPetHealthReminderRepository jpaRepository;

    public PetHealthReminderRepositoryImpl(JpaPetHealthReminderRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PetHealthReminder save(PetHealthReminder reminder) {
        return jpaRepository.save(reminder);
    }

    @Override
    public Optional<PetHealthReminder> findById(Long id) {
        return jpaRepository.findById(Objects.requireNonNull(id));
    }

    @Override
    public void delete(PetHealthReminder reminder) {
        jpaRepository.delete(reminder);
    }

    @Override
    public List<PetHealthReminder> findByPetIdAndStatusOrderByDueDateAsc(Long petId, PetReminderStatus status) {
        return jpaRepository.findByPetIdAndStatusOrderByDueDateAsc(petId, status);
    }

    @Override
    public List<PetHealthReminder> findUpcomingByOwnerUserId(
            Long ownerUserId,
            LocalDate fromDate,
            PetReminderStatus status) {
        return jpaRepository.findUpcomingByOwnerUserId(ownerUserId, fromDate, status);
    }

    @Override
    public List<PetHealthReminder> findDueByOwnerUserId(
            Long ownerUserId,
            LocalDate today,
            PetReminderStatus status) {
        return jpaRepository.findDueByOwnerUserId(ownerUserId, today, status);
    }
}
