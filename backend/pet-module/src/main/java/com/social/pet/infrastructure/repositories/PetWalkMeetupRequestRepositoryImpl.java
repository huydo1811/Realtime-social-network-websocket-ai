package com.social.pet.infrastructure.repositories;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.pet.domain.entities.PetWalkMeetupRequest;
import com.social.pet.domain.repositories.PetWalkMeetupRequestRepository;

@Repository
public class PetWalkMeetupRequestRepositoryImpl implements PetWalkMeetupRequestRepository {
    private final JpaPetWalkMeetupRequestRepository jpaRepository;

    public PetWalkMeetupRequestRepositoryImpl(JpaPetWalkMeetupRequestRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PetWalkMeetupRequest save(PetWalkMeetupRequest request) {
        return jpaRepository.save(request);
    }

    @Override
    public Optional<PetWalkMeetupRequest> findById(Long id) {
        return jpaRepository.findById(Objects.requireNonNull(id));
    }

    @Override
    public List<PetWalkMeetupRequest> findByWalkSessionIdOrderByCreatedAtDesc(Long walkSessionId) {
        return jpaRepository.findByWalkSessionIdOrderByCreatedAtDesc(Objects.requireNonNull(walkSessionId));
    }

    @Override
    public List<PetWalkMeetupRequest> findByRequesterUserIdOrderByCreatedAtDesc(Long requesterUserId) {
        return jpaRepository.findByRequesterUserIdOrderByCreatedAtDesc(Objects.requireNonNull(requesterUserId));
    }
}