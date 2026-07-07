package com.social.pet.application.usecases;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.repositories.PetRepository;
import com.social.pet.presentation.dto.PagedResponse;
import com.social.pet.presentation.dto.PetResponse;
import com.social.pet.presentation.mapper.PetMapper;

import org.springframework.data.domain.PageRequest;

@Service
public class AdminListPetsUseCase {

    private final PetRepository petRepository;
    private final PetMapper petMapper;

    public AdminListPetsUseCase(PetRepository petRepository, PetMapper petMapper) {
        this.petRepository = petRepository;
        this.petMapper = petMapper;
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public PagedResponse<PetResponse> execute(int page, int size) {
        var pageable = PageRequest.of(page, size);
        var paged = petRepository.findAll(pageable);
        var items = paged.getContent().stream()
                .map(petMapper::toResponse)
                .toList();
        return new PagedResponse<>(items, page, size, paged.getTotalElements());
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public PagedResponse<PetResponse> executeSearch(String query, int page, int size) {
        var pageable = PageRequest.of(page, size);
        var paged = petRepository.findByNameContainingIgnoreCase(query.trim(), pageable);
        var items = paged.getContent().stream()
                .map(petMapper::toResponse)
                .toList();
        return new PagedResponse<>(items, page, size, paged.getTotalElements());
    }
}
