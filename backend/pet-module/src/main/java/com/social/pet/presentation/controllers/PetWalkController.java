package com.social.pet.presentation.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.pet.application.usecases.CreatePetWalkMeetupRequestUseCase;
import com.social.pet.application.usecases.CreatePetWalkSessionUseCase;
import com.social.pet.application.usecases.FinishPetWalkSessionUseCase;
import com.social.pet.application.usecases.ListNearbyPetWalkSessionsUseCase;
import com.social.pet.application.usecases.ListJoinedPetWalkSessionsUseCase;
import com.social.pet.application.usecases.ListPetWalkMeetupRequestsUseCase;
import com.social.pet.application.usecases.ListPetWalkSessionsUseCase;
import com.social.pet.application.usecases.ListSentPetWalkMeetupRequestsUseCase;
import com.social.pet.application.usecases.RespondToPetWalkMeetupRequestUseCase;
import com.social.pet.presentation.dto.CreatePetWalkMeetupRequestDto;
import com.social.pet.presentation.dto.CreatePetWalkSessionRequest;
import com.social.pet.presentation.dto.FinishPetWalkSessionRequest;
import com.social.pet.presentation.dto.PetWalkMeetupRequestResponse;
import com.social.pet.presentation.dto.PetWalkSessionResponse;
import com.social.pet.presentation.mapper.PetWalkMapper;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/pets")
public class PetWalkController {
    private final CreatePetWalkSessionUseCase createPetWalkSessionUseCase;
    private final FinishPetWalkSessionUseCase finishPetWalkSessionUseCase;
    private final ListPetWalkSessionsUseCase listPetWalkSessionsUseCase;
    private final ListNearbyPetWalkSessionsUseCase listNearbyPetWalkSessionsUseCase;
    private final ListJoinedPetWalkSessionsUseCase listJoinedPetWalkSessionsUseCase;
    private final CreatePetWalkMeetupRequestUseCase createPetWalkMeetupRequestUseCase;
    private final RespondToPetWalkMeetupRequestUseCase respondToPetWalkMeetupRequestUseCase;
    private final ListPetWalkMeetupRequestsUseCase listPetWalkMeetupRequestsUseCase;
    private final ListSentPetWalkMeetupRequestsUseCase listSentPetWalkMeetupRequestsUseCase;
    private final PetWalkMapper petWalkMapper;

    public PetWalkController(
            CreatePetWalkSessionUseCase createPetWalkSessionUseCase,
            FinishPetWalkSessionUseCase finishPetWalkSessionUseCase,
            ListPetWalkSessionsUseCase listPetWalkSessionsUseCase,
            ListNearbyPetWalkSessionsUseCase listNearbyPetWalkSessionsUseCase,
            ListJoinedPetWalkSessionsUseCase listJoinedPetWalkSessionsUseCase,
            CreatePetWalkMeetupRequestUseCase createPetWalkMeetupRequestUseCase,
            RespondToPetWalkMeetupRequestUseCase respondToPetWalkMeetupRequestUseCase,
            ListPetWalkMeetupRequestsUseCase listPetWalkMeetupRequestsUseCase,
            ListSentPetWalkMeetupRequestsUseCase listSentPetWalkMeetupRequestsUseCase,
            PetWalkMapper petWalkMapper) {
        this.createPetWalkSessionUseCase = createPetWalkSessionUseCase;
        this.finishPetWalkSessionUseCase = finishPetWalkSessionUseCase;
        this.listPetWalkSessionsUseCase = listPetWalkSessionsUseCase;
        this.listNearbyPetWalkSessionsUseCase = listNearbyPetWalkSessionsUseCase;
        this.listJoinedPetWalkSessionsUseCase = listJoinedPetWalkSessionsUseCase;
        this.createPetWalkMeetupRequestUseCase = createPetWalkMeetupRequestUseCase;
        this.respondToPetWalkMeetupRequestUseCase = respondToPetWalkMeetupRequestUseCase;
        this.listPetWalkMeetupRequestsUseCase = listPetWalkMeetupRequestsUseCase;
        this.listSentPetWalkMeetupRequestsUseCase = listSentPetWalkMeetupRequestsUseCase;
        this.petWalkMapper = petWalkMapper;
    }

    @GetMapping("/{petId:\\d+}/walks")
    public ResponseEntity<List<PetWalkSessionResponse>> listWalks(@PathVariable Long petId) {
        List<PetWalkSessionResponse> sessions = listPetWalkSessionsUseCase.execute(currentUserId(), petId).stream()
                .map(petWalkMapper::toSessionResponse)
                .toList();
        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/{petId:\\d+}/walks")
    public ResponseEntity<PetWalkSessionResponse> createWalk(
            @PathVariable Long petId,
            @Valid @RequestBody CreatePetWalkSessionRequest request) {
        var session = createPetWalkSessionUseCase.execute(
                currentUserId(),
                petId,
                request.getVisibility(),
                request.getStartLatitude(),
                request.getStartLongitude(),
                request.getRouteName(),
                request.getNote());
        return ResponseEntity.ok(petWalkMapper.toSessionResponse(session));
    }

    @PostMapping("/{petId:\\d+}/walks/{walkId}/finish")
    public ResponseEntity<PetWalkSessionResponse> finishWalk(
            @PathVariable Long petId,
            @PathVariable Long walkId,
            @Valid @RequestBody FinishPetWalkSessionRequest request) {
        var session = finishPetWalkSessionUseCase.execute(
                currentUserId(),
                petId,
                walkId,
                request.getEndLatitude(),
                request.getEndLongitude());
        return ResponseEntity.ok(petWalkMapper.toSessionResponse(session));
    }

    @GetMapping("/walks/nearby")
    public ResponseEntity<List<PetWalkSessionResponse>> listNearby(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) Double radiusKm) {
        List<PetWalkSessionResponse> sessions = listNearbyPetWalkSessionsUseCase.execute(
                currentUserId(), latitude, longitude, radiusKm).stream()
                .map(petWalkMapper::toSessionResponse)
                .toList();
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/walks/joined")
    public ResponseEntity<List<PetWalkSessionResponse>> listJoinedSessions() {
        List<PetWalkSessionResponse> sessions = listJoinedPetWalkSessionsUseCase.execute(currentUserId()).stream()
                .map(petWalkMapper::toSessionResponse)
                .toList();
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/{petId:\\d+}/walk-meetups")
    public ResponseEntity<List<PetWalkMeetupRequestResponse>> listMeetups(@PathVariable Long petId) {
        List<PetWalkMeetupRequestResponse> requests = listPetWalkMeetupRequestsUseCase.execute(currentUserId(), petId)
                .stream()
                .map(petWalkMapper::toMeetupResponse)
                .toList();
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/walk-meetups/sent")
    public ResponseEntity<List<PetWalkMeetupRequestResponse>> listSentMeetups() {
        List<PetWalkMeetupRequestResponse> requests = listSentPetWalkMeetupRequestsUseCase.execute(currentUserId()).stream()
                .map(petWalkMapper::toMeetupResponse)
                .toList();
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/walks/{walkId}/meetups")
    public ResponseEntity<PetWalkMeetupRequestResponse> createMeetup(
            @PathVariable Long walkId,
            @Valid @RequestBody CreatePetWalkMeetupRequestDto request) {
        var meetup = createPetWalkMeetupRequestUseCase.execute(
                currentUserId(),
                walkId,
                request.getMessage(),
                request.getMeetupLatitude(),
                request.getMeetupLongitude());
        return ResponseEntity.ok(petWalkMapper.toMeetupResponse(meetup));
    }

    @PostMapping("/walk-meetups/{meetupId}/accept")
    public ResponseEntity<PetWalkMeetupRequestResponse> acceptMeetup(@PathVariable Long meetupId) {
        var meetup = respondToPetWalkMeetupRequestUseCase.accept(currentUserId(), meetupId);
        return ResponseEntity.ok(petWalkMapper.toMeetupResponse(meetup));
    }

    @PostMapping("/walk-meetups/{meetupId}/decline")
    public ResponseEntity<PetWalkMeetupRequestResponse> declineMeetup(@PathVariable Long meetupId) {
        var meetup = respondToPetWalkMeetupRequestUseCase.decline(currentUserId(), meetupId);
        return ResponseEntity.ok(petWalkMapper.toMeetupResponse(meetup));
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