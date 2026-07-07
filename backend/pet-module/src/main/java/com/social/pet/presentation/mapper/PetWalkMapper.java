package com.social.pet.presentation.mapper;

import org.springframework.stereotype.Component;

import com.social.pet.domain.entities.PetWalkMeetupRequest;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.repositories.PetRepository;
import com.social.pet.domain.repositories.PetWalkSessionRepository;
import com.social.pet.presentation.dto.PetWalkMeetupRequestResponse;
import com.social.pet.presentation.dto.PetWalkSessionResponse;
import com.social.user.domain.repositories.UserRepository;

@Component
public class PetWalkMapper {
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final PetWalkSessionRepository walkSessionRepository;

    public PetWalkMapper(
            PetRepository petRepository,
            UserRepository userRepository,
            PetWalkSessionRepository walkSessionRepository) {
        this.petRepository = petRepository;
        this.userRepository = userRepository;
        this.walkSessionRepository = walkSessionRepository;
    }

    public PetWalkSessionResponse toSessionResponse(PetWalkSession session) {
        PetWalkSessionResponse response = new PetWalkSessionResponse();
        response.setId(session.getId());
        response.setPetId(session.getPetId());
        petRepository.findById(session.getPetId()).ifPresent(pet -> response.setPetName(pet.getName()));
        response.setCreatedByUserId(session.getCreatedByUserId());
        response.setVisibility(session.getVisibility().name());
        response.setStatus(session.getStatus().name());
        response.setStartLatitude(session.getStartLatitude());
        response.setStartLongitude(session.getStartLongitude());
        response.setCurrentLatitude(session.getCurrentLatitude());
        response.setCurrentLongitude(session.getCurrentLongitude());
        response.setRouteName(session.getRouteName());
        response.setNote(session.getNote());
        response.setStartedAt(session.getStartedAt());
        response.setEndedAt(session.getEndedAt());
        response.setCreatedAt(session.getCreatedAt());
        response.setUpdatedAt(session.getUpdatedAt());
        return response;
    }

    public PetWalkMeetupRequestResponse toMeetupResponse(PetWalkMeetupRequest request) {
        PetWalkMeetupRequestResponse response = new PetWalkMeetupRequestResponse();
        response.setId(request.getId());
        response.setWalkSessionId(request.getWalkSessionId());
        walkSessionRepository.findById(request.getWalkSessionId())
                .ifPresent(session -> petRepository.findById(session.getPetId()).ifPresent(pet -> {
                    response.setPetId(pet.getId());
                    response.setPetName(pet.getName());
                }));
        response.setRequesterUserId(request.getRequesterUserId());
        userRepository.findById(request.getRequesterUserId())
                .ifPresent(user -> response.setRequesterName(user.getFullName()));
        response.setMessage(request.getMessage());
        response.setMeetupLatitude(request.getMeetupLatitude());
        response.setMeetupLongitude(request.getMeetupLongitude());
        response.setStatus(request.getStatus().name());
        response.setRespondedByUserId(request.getRespondedByUserId());
        response.setRespondedAt(request.getRespondedAt());
        response.setCreatedAt(request.getCreatedAt());
        response.setUpdatedAt(request.getUpdatedAt());
        return response;
    }
}