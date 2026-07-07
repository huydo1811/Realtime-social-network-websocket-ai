package com.social.pet.application.usecases;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.entities.PetStatus;
import com.social.pet.domain.entities.PetReminderStatus;
import com.social.pet.domain.repositories.PetRepository;
import com.social.pet.domain.repositories.PetHealthReminderRepository;
import com.social.pet.presentation.dto.AdminUserPetsResponse;
import com.social.pet.presentation.mapper.PetMapper;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@Service
public class AdminGetUserPetsUseCase {

    private final PetRepository petRepository;
    private final PetHealthReminderRepository reminderRepository;
    private final UserRepository userRepository;
    private final PetMapper petMapper;

    public AdminGetUserPetsUseCase(
            PetRepository petRepository,
            PetHealthReminderRepository reminderRepository,
            UserRepository userRepository,
            PetMapper petMapper) {
        this.petRepository = petRepository;
        this.reminderRepository = reminderRepository;
        this.userRepository = userRepository;
        this.petMapper = petMapper;
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public AdminUserPetsResponse execute(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        var pets = petRepository.findByOwnerUserId(userId);
        var activePets = pets.stream().filter(p -> p.getStatus() == PetStatus.ACTIVE).count();

        var pendingReminders = pets.stream()
                .mapToLong(pet ->
                    reminderRepository.findByPetIdAndStatusOrderByDueDateAsc(pet.getId(), PetReminderStatus.PENDING).size()
                )
                .sum();

        var response = new AdminUserPetsResponse();
        response.setUserId(userId);
        response.setFullName(user.getFullName());
        response.setUsername(user.getUsername());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setTotalPets(pets.size());
        response.setActivePets((int) activePets);
        response.setPendingReminders((int) pendingReminders);
        response.setPets(pets.stream().map(petMapper::toResponse).toList());

        return response;
    }
}
