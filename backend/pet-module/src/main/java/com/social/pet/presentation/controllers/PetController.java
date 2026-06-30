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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.pet.application.usecases.CreatePetUseCase;
import com.social.pet.application.usecases.DeletePetUseCase;
import com.social.pet.application.usecases.GetPetByIdUseCase;
import com.social.pet.application.usecases.ListDuePetRemindersUseCase;
import com.social.pet.application.usecases.ListMyPetsUseCase;
import com.social.pet.application.usecases.ListMyUpcomingRemindersUseCase;
import com.social.pet.application.usecases.ListPetBreedsUseCase;
import com.social.pet.application.usecases.ListUserPetsUseCase;
import com.social.pet.application.usecases.UpdatePetUseCase;
import com.social.pet.domain.entities.PetSpecies;
import com.social.pet.presentation.dto.CreatePetRequest;
import com.social.pet.presentation.dto.PetBreedResponse;
import com.social.pet.presentation.dto.PetHealthReminderResponse;
import com.social.pet.presentation.dto.PetResponse;
import com.social.pet.presentation.dto.UpdatePetRequest;
import com.social.pet.presentation.mapper.PetHealthMapper;
import com.social.pet.presentation.mapper.PetMapper;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/pets")
public class PetController {
    private final CreatePetUseCase createPetUseCase;
    private final UpdatePetUseCase updatePetUseCase;
    private final DeletePetUseCase deletePetUseCase;
    private final GetPetByIdUseCase getPetByIdUseCase;
    private final ListMyPetsUseCase listMyPetsUseCase;
    private final ListUserPetsUseCase listUserPetsUseCase;
    private final ListPetBreedsUseCase listPetBreedsUseCase;
    private final ListMyUpcomingRemindersUseCase listMyUpcomingRemindersUseCase;
    private final ListDuePetRemindersUseCase listDuePetRemindersUseCase;
    private final PetMapper petMapper;
    private final PetHealthMapper petHealthMapper;

    public PetController(
            CreatePetUseCase createPetUseCase,
            UpdatePetUseCase updatePetUseCase,
            DeletePetUseCase deletePetUseCase,
            GetPetByIdUseCase getPetByIdUseCase,
            ListMyPetsUseCase listMyPetsUseCase,
            ListUserPetsUseCase listUserPetsUseCase,
            ListPetBreedsUseCase listPetBreedsUseCase,
            ListMyUpcomingRemindersUseCase listMyUpcomingRemindersUseCase,
            ListDuePetRemindersUseCase listDuePetRemindersUseCase,
            PetMapper petMapper,
            PetHealthMapper petHealthMapper) {
        this.createPetUseCase = createPetUseCase;
        this.updatePetUseCase = updatePetUseCase;
        this.deletePetUseCase = deletePetUseCase;
        this.getPetByIdUseCase = getPetByIdUseCase;
        this.listMyPetsUseCase = listMyPetsUseCase;
        this.listUserPetsUseCase = listUserPetsUseCase;
        this.listPetBreedsUseCase = listPetBreedsUseCase;
        this.listMyUpcomingRemindersUseCase = listMyUpcomingRemindersUseCase;
        this.listDuePetRemindersUseCase = listDuePetRemindersUseCase;
        this.petMapper = petMapper;
        this.petHealthMapper = petHealthMapper;
    }

    @PostMapping
    public ResponseEntity<PetResponse> create(@Valid @RequestBody CreatePetRequest request) {
        var pet = createPetUseCase.execute(
                currentUserId(),
                request.getName(),
                request.getSpecies(),
                request.getBreed(),
                request.getGender(),
                request.getBirthDate(),
                request.getWeightKg(),
                request.getAvatarUrl(),
                request.getBio(),
                request.getMicrochipCode(),
                request.getVisibility());
        return ResponseEntity.ok(petMapper.toResponse(pet));
    }

    @GetMapping("/me")
    public ResponseEntity<List<PetResponse>> listMine() {
        List<PetResponse> pets = listMyPetsUseCase.execute(currentUserId()).stream()
                .map(petMapper::toResponse)
                .toList();
        return ResponseEntity.ok(pets);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PetResponse>> listByUser(@PathVariable Long userId) {
        List<PetResponse> pets = listUserPetsUseCase.execute(currentUserId(), userId).stream()
                .map(petMapper::toResponse)
                .toList();
        return ResponseEntity.ok(pets);
    }

    @GetMapping("/me/reminders/upcoming")
    public ResponseEntity<List<PetHealthReminderResponse>> listMyUpcomingReminders() {
        List<PetHealthReminderResponse> reminders = listMyUpcomingRemindersUseCase.execute(currentUserId()).stream()
                .map(petHealthMapper::toReminderResponse)
                .toList();
        return ResponseEntity.ok(reminders);
    }

    @GetMapping("/me/reminders/due")
    public ResponseEntity<List<PetHealthReminderResponse>> listDueReminders() {
        List<PetHealthReminderResponse> reminders = listDuePetRemindersUseCase.execute(currentUserId()).stream()
                .map(petHealthMapper::toReminderResponse)
                .toList();
        return ResponseEntity.ok(reminders);
    }

    @GetMapping("/breeds")
    public ResponseEntity<List<PetBreedResponse>> listBreeds(
            @RequestParam(required = false) PetSpecies species) {
        List<PetBreedResponse> breeds = listPetBreedsUseCase.execute(species).stream()
                .map(petMapper::toBreedResponse)
                .toList();
        return ResponseEntity.ok(breeds);
    }

    @GetMapping("/{petId:\\d+}")
    public ResponseEntity<PetResponse> getById(@PathVariable Long petId) {
        return ResponseEntity.ok(petMapper.toResponse(getPetByIdUseCase.execute(currentUserId(), petId)));
    }

    @PutMapping("/{petId:\\d+}")
    public ResponseEntity<PetResponse> update(
            @PathVariable Long petId,
            @Valid @RequestBody UpdatePetRequest request) {
        var pet = updatePetUseCase.execute(
                currentUserId(),
                petId,
                request.getName(),
                request.getSpecies(),
                request.getBreed(),
                request.getGender(),
                request.getBirthDate(),
                request.getWeightKg(),
                request.getAvatarUrl(),
                request.getBio(),
                request.getMicrochipCode(),
                request.getStatus(),
                request.getVisibility());
        return ResponseEntity.ok(petMapper.toResponse(pet));
    }

    @DeleteMapping("/{petId:\\d+}")
    public ResponseEntity<Void> delete(@PathVariable Long petId) {
        deletePetUseCase.execute(currentUserId(), petId);
        return ResponseEntity.noContent().build();
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
