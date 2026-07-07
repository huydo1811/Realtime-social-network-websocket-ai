package com.social.pet.application.usecases;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.repositories.PetRepository;
import com.social.pet.presentation.dto.PagedResponse;
import com.social.pet.presentation.dto.PetResponse;
import com.social.pet.presentation.mapper.PetMapper;

import org.springframework.data.domain.PageRequest;

@Service
public class AdminListPetsByOwnerUseCase {

    private final PetRepository petRepository;
    private final PetMapper petMapper;

    public AdminListPetsByOwnerUseCase(PetRepository petRepository, PetMapper petMapper) {
        this.petRepository = petRepository;
        this.petMapper = petMapper;
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public PagedResponse<PetResponse> execute(Long ownerUserId, int page, int size) {
        var pageable = PageRequest.of(page, size);
        var paged = petRepository.findByOwnerUserId(ownerUserId, pageable);
        var items = paged.getContent().stream()
                .map(petMapper::toResponse)
                .toList();
        return new PagedResponse<>(items, page, size, paged.getTotalElements());
    }
}
