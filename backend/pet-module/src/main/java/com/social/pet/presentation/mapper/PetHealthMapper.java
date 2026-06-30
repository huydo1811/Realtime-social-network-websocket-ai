package com.social.pet.presentation.mapper;

import org.springframework.stereotype.Component;

import com.social.pet.domain.entities.PetHealthRecord;
import com.social.pet.domain.entities.PetHealthReminder;
import com.social.pet.domain.repositories.PetRepository;
import com.social.pet.presentation.dto.PetHealthRecordResponse;
import com.social.pet.presentation.dto.PetHealthReminderResponse;

@Component
public class PetHealthMapper {
    private final PetRepository petRepository;

    public PetHealthMapper(PetRepository petRepository) {
        this.petRepository = petRepository;
    }

    public PetHealthRecordResponse toRecordResponse(PetHealthRecord record) {
        PetHealthRecordResponse response = new PetHealthRecordResponse();
        response.setId(record.getId());
        response.setPetId(record.getPetId());
        response.setRecordType(record.getRecordType().name());
        response.setTitle(record.getTitle());
        response.setDescription(record.getDescription());
        response.setPerformedAt(record.getPerformedAt());
        response.setClinicName(record.getClinicName());
        response.setDocumentUrl(record.getDocumentUrl());
        response.setCreatedByUserId(record.getCreatedByUserId());
        response.setCreatedAt(record.getCreatedAt());
        response.setUpdatedAt(record.getUpdatedAt());
        return response;
    }

    public PetHealthReminderResponse toReminderResponse(PetHealthReminder reminder) {
        PetHealthReminderResponse response = new PetHealthReminderResponse();
        response.setId(reminder.getId());
        response.setPetId(reminder.getPetId());
        petRepository.findById(reminder.getPetId()).ifPresent(pet -> response.setPetName(pet.getName()));
        response.setHealthRecordId(reminder.getHealthRecordId());
        response.setTitle(reminder.getTitle());
        response.setReminderType(reminder.getReminderType().name());
        response.setDueDate(reminder.getDueDate());
        response.setStatus(reminder.getStatus().name());
        response.setNote(reminder.getNote());
        response.setCreatedByUserId(reminder.getCreatedByUserId());
        response.setCreatedAt(reminder.getCreatedAt());
        response.setUpdatedAt(reminder.getUpdatedAt());
        return response;
    }
}
