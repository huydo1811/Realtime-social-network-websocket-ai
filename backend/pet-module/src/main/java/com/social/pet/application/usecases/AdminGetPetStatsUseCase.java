package com.social.pet.application.usecases;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.entities.PetReminderStatus;
import com.social.pet.domain.entities.PetStatus;
import com.social.pet.domain.repositories.PetDiagnosisRepository;
import com.social.pet.domain.repositories.PetHealthReminderRepository;
import com.social.pet.domain.repositories.PetRepository;
import com.social.pet.domain.repositories.PetWalkSessionRepository;
import com.social.pet.presentation.dto.AdminPetStatsResponse;

import java.time.LocalDate;

@Service
public class AdminGetPetStatsUseCase {

    private final PetRepository petRepository;
    private final PetDiagnosisRepository diagnosisRepository;
    private final PetWalkSessionRepository walkRepository;
    private final PetHealthReminderRepository reminderRepository;

    public AdminGetPetStatsUseCase(
            PetRepository petRepository,
            PetDiagnosisRepository diagnosisRepository,
            PetWalkSessionRepository walkRepository,
            PetHealthReminderRepository reminderRepository) {
        this.petRepository = petRepository;
        this.diagnosisRepository = diagnosisRepository;
        this.walkRepository = walkRepository;
        this.reminderRepository = reminderRepository;
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public AdminPetStatsResponse execute() {
        long totalPets = petRepository.count();
        long totalActivePets = petRepository.countByStatus(PetStatus.ACTIVE);
        long totalDiagnoses = diagnosisRepository.count();
        long totalWalkSessions = walkRepository.count();

        long pendingReminders = reminderRepository.countByStatus(PetReminderStatus.PENDING);
        long overdueReminders = reminderRepository.countOverdue(LocalDate.now(), PetReminderStatus.PENDING);

        return new AdminPetStatsResponse(
                totalPets,
                totalActivePets,
                totalWalkSessions,
                totalDiagnoses,
                pendingReminders,
                overdueReminders
        );
    }
}
