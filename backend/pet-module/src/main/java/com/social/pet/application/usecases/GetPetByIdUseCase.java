package com.social.pet.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.application.services.PetAccessService;
import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.repositories.PetRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class GetPetByIdUseCase {
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final PetAccessService petAccessService;

    public GetPetByIdUseCase(
            PetRepository petRepository,
            UserRepository userRepository,
            PetAccessService petAccessService) {
        this.petRepository = petRepository;
        this.userRepository = userRepository;
        this.petAccessService = petAccessService;
    }

    @Transactional(readOnly = true)
    public Pet execute(Long actorId, Long petId) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new PetDomainException("Không tìm thấy thú cưng"));
        petAccessService.ensureCanView(actorId, pet);
        return pet;
    }
}
