package com.social.pet.application.usecases;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.entities.PetGender;
import com.social.pet.domain.entities.PetSpecies;
import com.social.pet.domain.entities.PetStatus;
import com.social.pet.domain.entities.PetVisibility;
import com.social.moderation.application.usecases.ModerateImageUseCase;
import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.exceptions.PetImageModerationRejectedException;
import com.social.pet.domain.repositories.PetRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class UpdatePetUseCase {
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final ModerateImageUseCase moderateImageUseCase;

    public UpdatePetUseCase(
            PetRepository petRepository,
            UserRepository userRepository,
            ModerateImageUseCase moderateImageUseCase) {
        this.petRepository = petRepository;
        this.userRepository = userRepository;
        this.moderateImageUseCase = moderateImageUseCase;
    }

    @Transactional
    public Pet execute(
            Long actorId,
            Long petId,
            String name,
            PetSpecies species,
            String breed,
            PetGender gender,
            LocalDate birthDate,
            BigDecimal weightKg,
            String avatarUrl,
            String bio,
            String microchipCode,
            PetStatus status,
            PetVisibility visibility) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        if (avatarUrl != null && !avatarUrl.isBlank()) {
            var imageResult = moderateImageUseCase.moderate(avatarUrl.trim());
            if (imageResult.violation()) {
                throw new PetImageModerationRejectedException(imageResult);
            }
        }
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new PetDomainException("Không tìm thấy thú cưng"));
        pet.update(actorId, name, species, breed, gender, birthDate,
                weightKg, avatarUrl, bio, microchipCode, status, visibility);
        return petRepository.save(pet);
    }
}
