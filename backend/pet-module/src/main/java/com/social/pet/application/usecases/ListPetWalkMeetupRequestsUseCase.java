package com.social.pet.application.usecases;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.social.pet.application.services.PetOwnerService;
import com.social.pet.domain.entities.PetWalkMeetupRequest;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.entities.PetWalkMeetupRequest;
import com.social.pet.domain.repositories.PetWalkMeetupRequestRepository;
import com.social.pet.domain.repositories.PetWalkSessionRepository;

@Service
public class ListPetWalkMeetupRequestsUseCase {
    private final PetOwnerService petOwnerService;
    private final PetWalkMeetupRequestRepository meetupRequestRepository;
    private final PetWalkSessionRepository walkSessionRepository;

    public ListPetWalkMeetupRequestsUseCase(
            PetOwnerService petOwnerService,
            PetWalkMeetupRequestRepository meetupRequestRepository,
            PetWalkSessionRepository walkSessionRepository) {
        this.petOwnerService = petOwnerService;
        this.meetupRequestRepository = meetupRequestRepository;
        this.walkSessionRepository = walkSessionRepository;
    }

    public List<PetWalkMeetupRequest> execute(Long actorId, Long petId) {
        petOwnerService.requireOwnedPet(actorId, petId);
        List<PetWalkMeetupRequest> requests = new ArrayList<>();
        List<PetWalkSession> sessions = walkSessionRepository.findByPetIdOrderByStartedAtDesc(petId);
        for (PetWalkSession session : sessions) {
            requests.addAll(meetupRequestRepository.findByWalkSessionIdOrderByCreatedAtDesc(session.getId()));
        }
        return requests.stream()
                .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                .toList();
    }
}