package com.social.pet.presentation.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.social.pet.application.usecases.CompletePetHealthReminderUseCase;
import com.social.pet.application.usecases.CreatePetHealthRecordUseCase;
import com.social.pet.application.usecases.CreatePetHealthReminderUseCase;
import com.social.pet.application.usecases.DeletePetHealthRecordUseCase;
import com.social.pet.application.usecases.DismissPetHealthReminderUseCase;
import com.social.pet.application.usecases.ListPetHealthRecordsUseCase;
import com.social.pet.application.usecases.ListPetHealthRemindersUseCase;
import com.social.pet.application.usecases.UpdatePetHealthRecordUseCase;
import com.social.pet.presentation.dto.CreatePetHealthRecordRequest;
import com.social.pet.presentation.dto.CreatePetHealthReminderRequest;
import com.social.pet.presentation.dto.PetHealthRecordResponse;
import com.social.pet.presentation.dto.PetHealthReminderResponse;
import com.social.pet.presentation.mapper.PetHealthMapper;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/pets/{petId:\\d+}")
public class PetHealthController {
    private final CreatePetHealthRecordUseCase createPetHealthRecordUseCase;
    private final ListPetHealthRecordsUseCase listPetHealthRecordsUseCase;
    private final UpdatePetHealthRecordUseCase updatePetHealthRecordUseCase;
    private final DeletePetHealthRecordUseCase deletePetHealthRecordUseCase;
    private final CreatePetHealthReminderUseCase createPetHealthReminderUseCase;
    private final ListPetHealthRemindersUseCase listPetHealthRemindersUseCase;
    private final CompletePetHealthReminderUseCase completePetHealthReminderUseCase;
    private final DismissPetHealthReminderUseCase dismissPetHealthReminderUseCase;
    private final PetHealthMapper petHealthMapper;

    public PetHealthController(
            CreatePetHealthRecordUseCase createPetHealthRecordUseCase,
            ListPetHealthRecordsUseCase listPetHealthRecordsUseCase,
            UpdatePetHealthRecordUseCase updatePetHealthRecordUseCase,
            DeletePetHealthRecordUseCase deletePetHealthRecordUseCase,
            CreatePetHealthReminderUseCase createPetHealthReminderUseCase,
            ListPetHealthRemindersUseCase listPetHealthRemindersUseCase,
            CompletePetHealthReminderUseCase completePetHealthReminderUseCase,
            DismissPetHealthReminderUseCase dismissPetHealthReminderUseCase,
            PetHealthMapper petHealthMapper) {
        this.createPetHealthRecordUseCase = createPetHealthRecordUseCase;
        this.listPetHealthRecordsUseCase = listPetHealthRecordsUseCase;
        this.updatePetHealthRecordUseCase = updatePetHealthRecordUseCase;
        this.deletePetHealthRecordUseCase = deletePetHealthRecordUseCase;
        this.createPetHealthReminderUseCase = createPetHealthReminderUseCase;
        this.listPetHealthRemindersUseCase = listPetHealthRemindersUseCase;
        this.completePetHealthReminderUseCase = completePetHealthReminderUseCase;
        this.dismissPetHealthReminderUseCase = dismissPetHealthReminderUseCase;
        this.petHealthMapper = petHealthMapper;
    }

    @GetMapping("/health-records")
    public ResponseEntity<List<PetHealthRecordResponse>> listRecords(@PathVariable Long petId) {
        List<PetHealthRecordResponse> records = listPetHealthRecordsUseCase.execute(currentUserId(), petId).stream()
                .map(petHealthMapper::toRecordResponse)
                .toList();
        return ResponseEntity.ok(records);
    }

    @PostMapping("/health-records")
    public ResponseEntity<PetHealthRecordResponse> createRecord(
            @PathVariable Long petId,
            @Valid @RequestBody CreatePetHealthRecordRequest request) {
        var record = createPetHealthRecordUseCase.execute(
                currentUserId(),
                petId,
                request.getRecordType(),
                request.getTitle(),
                request.getDescription(),
                request.getPerformedAt(),
                request.getClinicName(),
                request.getDocumentUrl());
        return ResponseEntity.ok(petHealthMapper.toRecordResponse(record));
    }

    @PutMapping("/health-records/{recordId}")
    public ResponseEntity<PetHealthRecordResponse> updateRecord(
            @PathVariable Long petId,
            @PathVariable Long recordId,
            @Valid @RequestBody CreatePetHealthRecordRequest request) {
        var record = updatePetHealthRecordUseCase.execute(
                currentUserId(),
                petId,
                recordId,
                request.getRecordType(),
                request.getTitle(),
                request.getDescription(),
                request.getPerformedAt(),
                request.getClinicName(),
                request.getDocumentUrl());
        return ResponseEntity.ok(petHealthMapper.toRecordResponse(record));
    }

    @DeleteMapping("/health-records/{recordId}")
    public ResponseEntity<Void> deleteRecord(@PathVariable Long petId, @PathVariable Long recordId) {
        deletePetHealthRecordUseCase.execute(currentUserId(), petId, recordId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/reminders")
    public ResponseEntity<List<PetHealthReminderResponse>> listReminders(@PathVariable Long petId) {
        List<PetHealthReminderResponse> reminders = listPetHealthRemindersUseCase.execute(currentUserId(), petId).stream()
                .map(petHealthMapper::toReminderResponse)
                .toList();
        return ResponseEntity.ok(reminders);
    }

    @PostMapping("/reminders")
    public ResponseEntity<PetHealthReminderResponse> createReminder(
            @PathVariable Long petId,
            @Valid @RequestBody CreatePetHealthReminderRequest request) {
        var reminder = createPetHealthReminderUseCase.execute(
                currentUserId(),
                petId,
                request.getHealthRecordId(),
                request.getTitle(),
                request.getReminderType(),
                request.getDueDate(),
                request.getNote());
        return ResponseEntity.ok(petHealthMapper.toReminderResponse(reminder));
    }

    @PostMapping("/reminders/{reminderId}/complete")
    public ResponseEntity<PetHealthReminderResponse> completeReminder(
            @PathVariable Long petId,
            @PathVariable Long reminderId) {
        var reminder = completePetHealthReminderUseCase.execute(currentUserId(), petId, reminderId);
        return ResponseEntity.ok(petHealthMapper.toReminderResponse(reminder));
    }

    @PostMapping("/reminders/{reminderId}/dismiss")
    public ResponseEntity<PetHealthReminderResponse> dismissReminder(
            @PathVariable Long petId,
            @PathVariable Long reminderId) {
        var reminder = dismissPetHealthReminderUseCase.execute(currentUserId(), petId, reminderId);
        return ResponseEntity.ok(petHealthMapper.toReminderResponse(reminder));
    }

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new IllegalArgumentException("Vui lòng đăng nhập để thực hiện thao tác này");
        }
        try {
            return Long.parseLong(String.valueOf(auth.getPrincipal()));
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Token không hợp lệ");
        }
    }
}
