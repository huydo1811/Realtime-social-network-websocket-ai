package com.social.pet.presentation.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.pet.application.usecases.AdminGetPetDetailUseCase;
import com.social.pet.application.usecases.AdminGetPetStatsUseCase;
import com.social.pet.application.usecases.AdminGetUserPetsUseCase;
import com.social.pet.application.usecases.AdminListDiagnosesByOwnerUseCase;
import com.social.pet.application.usecases.AdminListDiagnosesUseCase;
import com.social.pet.application.usecases.AdminListPetsByOwnerUseCase;
import com.social.pet.application.usecases.AdminListPetsUseCase;
import com.social.pet.application.usecases.AdminListRemindersByOwnerUseCase;
import com.social.pet.application.usecases.AdminListRemindersUseCase;
import com.social.pet.application.usecases.AdminListWalksByOwnerUseCase;
import com.social.pet.application.usecases.AdminListWalksUseCase;
import com.social.pet.presentation.dto.AdminPetDetailResponse;
import com.social.pet.presentation.dto.AdminPetStatsResponse;
import com.social.pet.presentation.dto.AdminUserPetsResponse;
import com.social.pet.presentation.dto.PagedResponse;
import com.social.pet.presentation.dto.PetDiagnosisResponse;
import com.social.pet.presentation.dto.PetHealthReminderResponse;
import com.social.pet.presentation.dto.PetResponse;
import com.social.pet.presentation.dto.PetWalkSessionResponse;

@RestController
@RequestMapping("/pets/admin")
@PreAuthorize("hasRole('ADMIN')")
public class PetAdminController {

    private final AdminGetPetStatsUseCase statsUseCase;
    private final AdminGetUserPetsUseCase getUserPetsUseCase;
    private final AdminGetPetDetailUseCase getPetDetailUseCase;
    private final AdminListPetsUseCase listPetsUseCase;
    private final AdminListRemindersUseCase listRemindersUseCase;
    private final AdminListDiagnosesUseCase listDiagnosesUseCase;
    private final AdminListWalksUseCase listWalksUseCase;
    private final AdminListPetsByOwnerUseCase listPetsByOwnerUseCase;
    private final AdminListDiagnosesByOwnerUseCase listDiagnosesByOwnerUseCase;
    private final AdminListWalksByOwnerUseCase listWalksByOwnerUseCase;
    private final AdminListRemindersByOwnerUseCase listRemindersByOwnerUseCase;

    public PetAdminController(
            AdminGetPetStatsUseCase statsUseCase,
            AdminGetUserPetsUseCase getUserPetsUseCase,
            AdminGetPetDetailUseCase getPetDetailUseCase,
            AdminListPetsUseCase listPetsUseCase,
            AdminListRemindersUseCase listRemindersUseCase,
            AdminListDiagnosesUseCase listDiagnosesUseCase,
            AdminListWalksUseCase listWalksUseCase,
            AdminListPetsByOwnerUseCase listPetsByOwnerUseCase,
            AdminListDiagnosesByOwnerUseCase listDiagnosesByOwnerUseCase,
            AdminListWalksByOwnerUseCase listWalksByOwnerUseCase,
            AdminListRemindersByOwnerUseCase listRemindersByOwnerUseCase) {
        this.statsUseCase = statsUseCase;
        this.getUserPetsUseCase = getUserPetsUseCase;
        this.getPetDetailUseCase = getPetDetailUseCase;
        this.listPetsUseCase = listPetsUseCase;
        this.listRemindersUseCase = listRemindersUseCase;
        this.listDiagnosesUseCase = listDiagnosesUseCase;
        this.listWalksUseCase = listWalksUseCase;
        this.listPetsByOwnerUseCase = listPetsByOwnerUseCase;
        this.listDiagnosesByOwnerUseCase = listDiagnosesByOwnerUseCase;
        this.listWalksByOwnerUseCase = listWalksByOwnerUseCase;
        this.listRemindersByOwnerUseCase = listRemindersByOwnerUseCase;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminPetStatsResponse> getStats() {
        return ResponseEntity.ok(statsUseCase.execute());
    }

    @GetMapping("/users/{userId}/pets")
    public ResponseEntity<AdminUserPetsResponse> getUserPets(@PathVariable Long userId) {
        return ResponseEntity.ok(getUserPetsUseCase.execute(userId));
    }

    @GetMapping("/pets/{petId}")
    public ResponseEntity<AdminPetDetailResponse> getPetDetail(@PathVariable Long petId) {
        return ResponseEntity.ok(getPetDetailUseCase.execute(petId));
    }

    @GetMapping("/search")
    public ResponseEntity<PagedResponse<PetResponse>> searchPets(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(listPetsUseCase.executeSearch(q, page, size));
        }
        return ResponseEntity.ok(listPetsUseCase.execute(page, size));
    }

    @GetMapping("/reminders")
    public ResponseEntity<PagedResponse<PetHealthReminderResponse>> listReminders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(listRemindersUseCase.execute(page, size));
    }

    @GetMapping("/diagnoses")
    public ResponseEntity<PagedResponse<PetDiagnosisResponse>> listDiagnoses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(listDiagnosesUseCase.execute(page, size));
    }

    @GetMapping("/walks")
    public ResponseEntity<PagedResponse<PetWalkSessionResponse>> listWalks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(listWalksUseCase.execute(page, size));
    }

    // ── User-scoped (drilldown) ──────────────────────────────────────────────

    @GetMapping("/users/{userId}/pets-page")
    public ResponseEntity<PagedResponse<PetResponse>> listPetsByOwner(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(listPetsByOwnerUseCase.execute(userId, page, size));
    }

    @GetMapping("/users/{userId}/diagnoses")
    public ResponseEntity<PagedResponse<PetDiagnosisResponse>> listDiagnosesByOwner(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(listDiagnosesByOwnerUseCase.execute(userId, page, size));
    }

    @GetMapping("/users/{userId}/walks")
    public ResponseEntity<PagedResponse<PetWalkSessionResponse>> listWalksByOwner(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(listWalksByOwnerUseCase.execute(userId, page, size));
    }

    @GetMapping("/users/{userId}/reminders")
    public ResponseEntity<PagedResponse<PetHealthReminderResponse>> listRemindersByOwner(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(listRemindersByOwnerUseCase.execute(userId, page, size));
    }
}
