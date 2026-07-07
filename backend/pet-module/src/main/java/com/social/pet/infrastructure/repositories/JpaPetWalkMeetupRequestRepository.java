package com.social.pet.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.pet.domain.entities.PetWalkMeetupRequest;

public interface JpaPetWalkMeetupRequestRepository extends JpaRepository<PetWalkMeetupRequest, Long> {
    List<PetWalkMeetupRequest> findByWalkSessionIdOrderByCreatedAtDesc(Long walkSessionId);

    List<PetWalkMeetupRequest> findByRequesterUserIdOrderByCreatedAtDesc(Long requesterUserId);
}