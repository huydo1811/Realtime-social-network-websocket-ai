package com.social.pet.application.usecases;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.repositories.PetDiagnosisRepository;
import com.social.pet.domain.repositories.PetHealthReminderRepository;
import com.social.pet.domain.repositories.PetHealthRecordRepository;
import com.social.pet.domain.repositories.PetRepository;
import com.social.pet.domain.repositories.PetWalkSessionRepository;
import com.social.pet.presentation.dto.AdminPetDetailResponse;
import com.social.pet.presentation.mapper.PetDiagnosisMapper;
import com.social.pet.presentation.mapper.PetHealthMapper;
import com.social.pet.presentation.mapper.PetMapper;
import com.social.pet.presentation.mapper.PetWalkMapper;

@Service
public class AdminGetPetDetailUseCase {

    private final PetRepository petRepository;
    private final PetHealthRecordRepository recordRepository;
    private final PetHealthReminderRepository reminderRepository;
    private final PetDiagnosisRepository diagnosisRepository;
    private final PetWalkSessionRepository walkRepository;
    private final PetMapper petMapper;
    private final PetHealthMapper healthMapper;
    private final PetDiagnosisMapper diagnosisMapper;
    private final PetWalkMapper walkMapper;

    public AdminGetPetDetailUseCase(
            PetRepository petRepository,
            PetHealthRecordRepository recordRepository,
            PetHealthReminderRepository reminderRepository,
            PetDiagnosisRepository diagnosisRepository,
            PetWalkSessionRepository walkRepository,
            PetMapper petMapper,
            PetHealthMapper healthMapper,
            PetDiagnosisMapper diagnosisMapper,
            PetWalkMapper walkMapper) {
        this.petRepository = petRepository;
        this.recordRepository = recordRepository;
        this.reminderRepository = reminderRepository;
        this.diagnosisRepository = diagnosisRepository;
        this.walkRepository = walkRepository;
        this.petMapper = petMapper;
        this.healthMapper = healthMapper;
        this.diagnosisMapper = diagnosisMapper;
        this.walkMapper = walkMapper;
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public AdminPetDetailResponse execute(Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new IllegalArgumentException("Thú cưng không tồn tại"));

        var response = new AdminPetDetailResponse();
        response.setPet(petMapper.toResponse(pet));
        response.setHealthRecords(
                recordRepository.findByPetIdOrderByPerformedAtDesc(petId).stream()
                        .map(healthMapper::toRecordResponse)
                        .toList());
        response.setReminders(
                reminderRepository.findByPetIdAndStatusOrderByDueDateAsc(petId,
                        com.social.pet.domain.entities.PetReminderStatus.PENDING).stream()
                        .map(healthMapper::toReminderResponse)
                        .toList());
        response.setRecentDiagnoses(
                diagnosisRepository.findByPetIdOrderByCreatedAtDesc(petId).stream()
                        .map(diagnosisMapper::toResponse)
                        .toList());
        response.setRecentWalks(
                walkRepository.findByPetIdOrderByStartedAtDesc(petId).stream()
                        .map(walkMapper::toSessionResponse)
                        .toList());

        return response;
    }
}
