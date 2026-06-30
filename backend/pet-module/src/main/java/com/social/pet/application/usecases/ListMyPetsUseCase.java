package com.social.pet.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.repositories.PetRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class ListMyPetsUseCase {
    private final PetRepository petRepository;
    private final UserRepository userRepository;

    public ListMyPetsUseCase(PetRepository petRepository, UserRepository userRepository) {
        this.petRepository = petRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Pet> execute(Long actorId) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        return petRepository.findByOwnerUserId(actorId);
    }
}
