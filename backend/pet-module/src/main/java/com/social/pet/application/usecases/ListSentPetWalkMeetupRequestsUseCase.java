package com.social.pet.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;

import com.social.pet.domain.entities.PetWalkMeetupRequest;
import com.social.pet.domain.repositories.PetWalkMeetupRequestRepository;

@Service
public class ListSentPetWalkMeetupRequestsUseCase {
    private final PetWalkMeetupRequestRepository meetupRequestRepository;

    public ListSentPetWalkMeetupRequestsUseCase(PetWalkMeetupRequestRepository meetupRequestRepository) {
        this.meetupRequestRepository = meetupRequestRepository;
    }

    public List<PetWalkMeetupRequest> execute(Long actorId) {
        return meetupRequestRepository.findByRequesterUserIdOrderByCreatedAtDesc(actorId);
    }
}
