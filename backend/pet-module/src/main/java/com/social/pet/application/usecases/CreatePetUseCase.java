package com.social.pet.application.usecases;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.entities.PetGender;
import com.social.pet.domain.entities.PetSpecies;
import com.social.pet.domain.entities.PetVisibility;
import com.social.moderation.application.usecases.ModerateImageUseCase;
import com.social.pet.domain.exceptions.PetImageModerationRejectedException;
import com.social.pet.domain.repositories.PetRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class CreatePetUseCase {
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final ModerateImageUseCase moderateImageUseCase;

    public CreatePetUseCase(
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
            String name,
            PetSpecies species,
            String breed,
            PetGender gender,
            LocalDate birthDate,
            BigDecimal weightKg,
            String avatarUrl,
            String bio,
            String microchipCode,
            PetVisibility visibility) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        if (avatarUrl != null && !avatarUrl.isBlank()) {
            var imageResult = moderateImageUseCase.moderate(avatarUrl.trim());
            if (imageResult.violation()) {
                throw new PetImageModerationRejectedException(imageResult);
            }
        }
        Pet pet = Pet.create(
                actorId, name, species, breed, gender, birthDate,
                weightKg, avatarUrl, bio, microchipCode, visibility);
        return petRepository.save(pet);
    }
}
