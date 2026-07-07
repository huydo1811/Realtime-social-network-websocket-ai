package com.social.pet.application.usecases;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.repositories.PetWalkSessionRepository;
import com.social.pet.presentation.dto.PagedResponse;
import com.social.pet.presentation.dto.PetWalkSessionResponse;
import com.social.pet.presentation.mapper.PetWalkMapper;

import org.springframework.data.domain.PageRequest;

@Service
public class AdminListWalksUseCase {

    private final PetWalkSessionRepository walkRepository;
    private final PetWalkMapper walkMapper;

    public AdminListWalksUseCase(PetWalkSessionRepository walkRepository, PetWalkMapper walkMapper) {
        this.walkRepository = walkRepository;
        this.walkMapper = walkMapper;
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public PagedResponse<PetWalkSessionResponse> execute(int page, int size) {
        var pageable = PageRequest.of(page, size);
        var paged = walkRepository.findAll(pageable);
        var items = paged.getContent().stream()
                .map(walkMapper::toSessionResponse)
                .toList();
        return new PagedResponse<>(items, page, size, paged.getTotalElements());
    }
}
