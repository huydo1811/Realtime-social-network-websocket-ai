package com.social.pet.application.usecases;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.repositories.PetHealthReminderRepository;
import com.social.pet.presentation.dto.PagedResponse;
import com.social.pet.presentation.dto.PetHealthReminderResponse;
import com.social.pet.presentation.mapper.PetHealthMapper;

import org.springframework.data.domain.PageRequest;

@Service
public class AdminListRemindersUseCase {

    private final PetHealthReminderRepository reminderRepository;
    private final PetHealthMapper reminderMapper;

    public AdminListRemindersUseCase(PetHealthReminderRepository reminderRepository, PetHealthMapper reminderMapper) {
        this.reminderRepository = reminderRepository;
        this.reminderMapper = reminderMapper;
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public PagedResponse<PetHealthReminderResponse> execute(int page, int size) {
        var pageable = PageRequest.of(page, size);
        var paged = reminderRepository.findAll(pageable);
        var items = paged.getContent().stream()
                .map(reminderMapper::toReminderResponse)
                .toList();
        return new PagedResponse<>(items, page, size, paged.getTotalElements());
    }
}
