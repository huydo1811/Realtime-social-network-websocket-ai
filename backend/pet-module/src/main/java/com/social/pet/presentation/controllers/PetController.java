package com.social.pet.presentation.controllers;

import java.util.List;
import java.util.ArrayList;

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
import com.social.pet.domain.entities.AppetiteLevel;
import com.social.pet.domain.entities.PetActivityEntry;
import com.social.pet.domain.entities.PetAppetiteEntry;
import com.social.pet.domain.entities.PetReminderStatus;
import com.social.pet.domain.entities.PetSpecies;
import com.social.pet.domain.entities.PetWalkSessionStatus;
import com.social.pet.domain.entities.PetWeightEntry;
import com.social.pet.domain.repositories.PetActivityEntryRepository;
import com.social.pet.domain.repositories.PetAppetiteEntryRepository;
import com.social.pet.domain.repositories.PetHealthRecordRepository;
import com.social.pet.domain.repositories.PetHealthReminderRepository;
import com.social.pet.domain.repositories.PetWalkSessionRepository;
import com.social.pet.domain.repositories.PetWeightEntryRepository;
import com.social.pet.presentation.dto.CreatePetActivityEntryRequest;
import com.social.pet.presentation.dto.CreatePetAppetiteEntryRequest;
import com.social.pet.presentation.dto.CreatePetRequest;
import com.social.pet.presentation.dto.CreatePetWeightEntryRequest;
import com.social.pet.presentation.dto.PetActivityEntryResponse;
import com.social.pet.presentation.dto.PetAppetiteEntryResponse;
import com.social.pet.presentation.dto.PetBreedResponse;
import com.social.pet.presentation.dto.PetHealthReminderResponse;
import com.social.pet.presentation.dto.PetResponse;
import com.social.pet.presentation.dto.PetSocialHealthSummaryResponse;
import com.social.pet.presentation.dto.PetSocialBadgeResponse;
import com.social.pet.presentation.dto.PetSocialPromptResponse;
import com.social.pet.presentation.dto.PetWeightEntryResponse;
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
    private final PetWeightEntryRepository petWeightEntryRepository;
    private final PetAppetiteEntryRepository petAppetiteEntryRepository;
    private final PetActivityEntryRepository petActivityEntryRepository;
    private final PetHealthRecordRepository petHealthRecordRepository;
    private final PetHealthReminderRepository petHealthReminderRepository;
    private final PetWalkSessionRepository petWalkSessionRepository;

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
            PetHealthMapper petHealthMapper,
            PetWeightEntryRepository petWeightEntryRepository,
            PetAppetiteEntryRepository petAppetiteEntryRepository,
            PetActivityEntryRepository petActivityEntryRepository,
            PetHealthRecordRepository petHealthRecordRepository,
            PetHealthReminderRepository petHealthReminderRepository,
            PetWalkSessionRepository petWalkSessionRepository) {
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
        this.petWeightEntryRepository = petWeightEntryRepository;
        this.petAppetiteEntryRepository = petAppetiteEntryRepository;
        this.petActivityEntryRepository = petActivityEntryRepository;
        this.petHealthRecordRepository = petHealthRecordRepository;
        this.petHealthReminderRepository = petHealthReminderRepository;
        this.petWalkSessionRepository = petWalkSessionRepository;
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

    @GetMapping("/{petId:\\d+}/social-health-summary")
    public ResponseEntity<PetSocialHealthSummaryResponse> getSocialHealthSummary(@PathVariable Long petId) {
        getPetByIdUseCase.execute(currentUserId(), petId);
        var reminders = petHealthReminderRepository.findByPetIdOrderByDueDateDesc(petId);
        var walks = petWalkSessionRepository.findByPetIdOrderByStartedAtDesc(petId);
        long reminderPending = reminders.stream().filter(r -> r.getStatus() == PetReminderStatus.PENDING).count();
        long reminderCompleted = reminders.stream().filter(r -> r.getStatus() == PetReminderStatus.COMPLETED).count();
        long walkFinished = walks.stream().filter(w -> w.getStatus() == PetWalkSessionStatus.FINISHED).count();
        long walkActive = walks.stream().filter(w -> w.getStatus() == PetWalkSessionStatus.ACTIVE).count();
        var response = new PetSocialHealthSummaryResponse(
                petHealthRecordRepository.findByPetIdOrderByPerformedAtDesc(petId).size(),
                reminders.size(),
                reminderPending,
                reminderCompleted,
                walks.size(),
                walkFinished,
                walkActive);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{petId:\\d+}/social-prompts")
    public ResponseEntity<List<PetSocialPromptResponse>> getSocialPrompts(@PathVariable Long petId) {
        var pet = getPetByIdUseCase.execute(currentUserId(), petId);
        var reminders = petHealthReminderRepository.findByPetIdOrderByDueDateDesc(petId);
        var walks = petWalkSessionRepository.findByPetIdOrderByStartedAtDesc(petId);
        long pendingReminderCount = reminders.stream().filter(r -> r.getStatus() == PetReminderStatus.PENDING).count();
        long finishedWalkCount = walks.stream().filter(w -> w.getStatus() == PetWalkSessionStatus.FINISHED).count();
        var records = petHealthRecordRepository.findByPetIdOrderByPerformedAtDesc(petId);

        List<PetSocialPromptResponse> prompts = new ArrayList<>();
        prompts.add(new PetSocialPromptResponse(
                "walk",
                "Chia sẻ vận động",
                "🐾 " + pet.getName() + " vừa hoàn thành " + finishedWalkCount + " buổi đi dạo. Cả nhà vào thả tim cho bé nhé!"));
        prompts.add(new PetSocialPromptResponse(
                "health",
                "Chia sẻ chăm sóc sức khỏe",
                "🩺 Sổ sức khỏe của " + pet.getName() + " đã có " + records.size()
                        + " bản ghi. Hiện còn " + pendingReminderCount + " lịch chăm sóc sắp tới."));
        prompts.add(new PetSocialPromptResponse(
                "daily",
                "Nhật ký hôm nay",
                "📔 Nhật ký pet hôm nay: " + pet.getName()
                        + " ăn ngoan, vui vẻ và đang được chăm sóc đều đặn. Mọi người có mẹo hay cho bé không?"));
        return ResponseEntity.ok(prompts);
    }

    @GetMapping("/{petId:\\d+}/social-badges")
    public ResponseEntity<List<PetSocialBadgeResponse>> getSocialBadges(@PathVariable Long petId) {
        var pet = getPetByIdUseCase.execute(currentUserId(), petId);
        var reminders = petHealthReminderRepository.findByPetIdOrderByDueDateDesc(petId);
        var walks = petWalkSessionRepository.findByPetIdOrderByStartedAtDesc(petId);
        var records = petHealthRecordRepository.findByPetIdOrderByPerformedAtDesc(petId);

        long finishedWalkCount = walks.stream().filter(w -> w.getStatus() == PetWalkSessionStatus.FINISHED).count();
        long completedReminderCount = reminders.stream().filter(r -> r.getStatus() == PetReminderStatus.COMPLETED).count();
        long recordCount = records.size();

        List<PetSocialBadgeResponse> badges = new ArrayList<>();
        badges.add(new PetSocialBadgeResponse(
                "walk_explorer",
                "Nhà thám hiểm đi dạo",
                "Hoàn thành tối thiểu 3 phiên đi dạo.",
                finishedWalkCount >= 3,
                finishedWalkCount + "/3 phiên",
                "🏅 " + pet.getName() + " vừa mở khóa huy hiệu Nhà thám hiểm đi dạo sau " + finishedWalkCount
                        + " phiên hoàn thành!"));
        badges.add(new PetSocialBadgeResponse(
                "care_keeper",
                "Người giữ nhịp chăm sóc",
                "Hoàn thành tối thiểu 3 lịch nhắc nhở sức khỏe.",
                completedReminderCount >= 3,
                completedReminderCount + "/3 lịch",
                "🏅 " + pet.getName() + " vừa mở khóa huy hiệu Người giữ nhịp chăm sóc với " + completedReminderCount
                        + " lịch đã hoàn thành!"));
        badges.add(new PetSocialBadgeResponse(
                "health_archivist",
                "Nhà lưu trữ sức khỏe",
                "Lưu tối thiểu 5 hồ sơ sức khỏe.",
                recordCount >= 5,
                recordCount + "/5 hồ sơ",
                "🏅 " + pet.getName() + " vừa mở khóa huy hiệu Nhà lưu trữ sức khỏe với " + recordCount
                        + " hồ sơ đã ghi nhận!"));
        return ResponseEntity.ok(badges);
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

    @GetMapping("/{petId:\\d+}/health/weight")
    public ResponseEntity<List<PetWeightEntryResponse>> listWeightEntries(@PathVariable Long petId) {
        List<PetWeightEntryResponse> entries = petWeightEntryRepository
                .findByPetIdOrderByRecordedAtDesc(petId)
                .stream()
                .map(petHealthMapper::toWeightEntryResponse)
                .toList();
        return ResponseEntity.ok(entries);
    }

    @PostMapping("/{petId:\\d+}/health/weight")
    public ResponseEntity<PetWeightEntryResponse> createWeightEntry(
            @PathVariable Long petId,
            @RequestBody CreatePetWeightEntryRequest request) {
        PetWeightEntry entry = PetWeightEntry.create(petId, request.getWeightKg(), request.getNote());
        PetWeightEntry saved = petWeightEntryRepository.save(entry);
        return ResponseEntity.ok(petHealthMapper.toWeightEntryResponse(saved));
    }

    @GetMapping("/{petId:\\d+}/health/appetite")
    public ResponseEntity<List<PetAppetiteEntryResponse>> listAppetiteEntries(@PathVariable Long petId) {
        List<PetAppetiteEntryResponse> entries = petAppetiteEntryRepository
                .findByPetIdOrderByRecordedAtDesc(petId)
                .stream()
                .map(petHealthMapper::toAppetiteEntryResponse)
                .toList();
        return ResponseEntity.ok(entries);
    }

    @PostMapping("/{petId:\\d+}/health/appetite")
    public ResponseEntity<PetAppetiteEntryResponse> createAppetiteEntry(
            @PathVariable Long petId,
            @RequestBody CreatePetAppetiteEntryRequest request) {
        AppetiteLevel level = request.getLevel() != null
                ? AppetiteLevel.valueOf(request.getLevel().toUpperCase())
                : AppetiteLevel.NORMAL;
        PetAppetiteEntry entry = PetAppetiteEntry.create(petId, level, request.getNote());
        PetAppetiteEntry saved = petAppetiteEntryRepository.save(entry);
        return ResponseEntity.ok(petHealthMapper.toAppetiteEntryResponse(saved));
    }

    @GetMapping("/{petId:\\d+}/health/activity")
    public ResponseEntity<List<PetActivityEntryResponse>> listActivityEntries(@PathVariable Long petId) {
        List<PetActivityEntryResponse> entries = petActivityEntryRepository
                .findByPetIdOrderByRecordedAtDesc(petId)
                .stream()
                .map(petHealthMapper::toActivityEntryResponse)
                .toList();
        return ResponseEntity.ok(entries);
    }

    @PostMapping("/{petId:\\d+}/health/activity")
    public ResponseEntity<PetActivityEntryResponse> createActivityEntry(
            @PathVariable Long petId,
            @RequestBody CreatePetActivityEntryRequest request) {
        PetActivityEntry entry = PetActivityEntry.create(
                petId,
                request.getMinutes(),
                request.getActivityType(),
                request.getNote());
        PetActivityEntry saved = petActivityEntryRepository.save(entry);
        return ResponseEntity.ok(petHealthMapper.toActivityEntryResponse(saved));
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
