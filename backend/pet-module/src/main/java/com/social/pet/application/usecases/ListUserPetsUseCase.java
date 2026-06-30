package com.social.pet.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.application.services.PetAccessService;
import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.repositories.PetRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class ListUserPetsUseCase {
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final PetAccessService petAccessService;

    public ListUserPetsUseCase(
            PetRepository petRepository,
            UserRepository userRepository,
            PetAccessService petAccessService) {
        this.petRepository = petRepository;
        this.userRepository = userRepository;
        this.petAccessService = petAccessService;
    }

    @Transactional(readOnly = true)
    public List<Pet> execute(Long actorId, Long targetUserId) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        userRepository.findById(targetUserId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        return petRepository.findByOwnerUserId(targetUserId).stream()
                .filter(pet -> petAccessService.canView(actorId, pet))
                .toList();
    }
}
