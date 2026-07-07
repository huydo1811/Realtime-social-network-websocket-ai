package com.social.pet.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.pet.domain.entities.PetWalkMeetupRequest;

public interface PetWalkMeetupRequestRepository {
    PetWalkMeetupRequest save(PetWalkMeetupRequest request);

    Optional<PetWalkMeetupRequest> findById(Long id);

    List<PetWalkMeetupRequest> findByWalkSessionIdOrderByCreatedAtDesc(Long walkSessionId);

    List<PetWalkMeetupRequest> findByRequesterUserIdOrderByCreatedAtDesc(Long requesterUserId);
}