package com.social.pet.application.usecases;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.repositories.PetDiagnosisRepository;
import com.social.pet.presentation.dto.PagedResponse;
import com.social.pet.presentation.dto.PetDiagnosisResponse;
import com.social.pet.presentation.mapper.PetDiagnosisMapper;

import org.springframework.data.domain.PageRequest;

@Service
public class AdminListDiagnosesByOwnerUseCase {

    private final PetDiagnosisRepository diagnosisRepository;
    private final PetDiagnosisMapper diagnosisMapper;

    public AdminListDiagnosesByOwnerUseCase(PetDiagnosisRepository diagnosisRepository,
                                            PetDiagnosisMapper diagnosisMapper) {
        this.diagnosisRepository = diagnosisRepository;
        this.diagnosisMapper = diagnosisMapper;
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public PagedResponse<PetDiagnosisResponse> execute(Long ownerUserId, int page, int size) {
        var pageable = PageRequest.of(page, size);
        var paged = diagnosisRepository.findByOwnerUserId(ownerUserId, pageable);
        var items = paged.getContent().stream()
                .map(diagnosisMapper::toResponse)
                .toList();
        return new PagedResponse<>(items, page, size, paged.getTotalElements());
    }
}
