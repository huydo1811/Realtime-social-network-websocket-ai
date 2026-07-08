package com.social.pet.application.usecases;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.social.pet.domain.entities.PetWalkMeetupStatus;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.repositories.PetWalkMeetupRequestRepository;
import com.social.pet.domain.repositories.PetWalkSessionRepository;

@Service
public class ListJoinedPetWalkSessionsUseCase {
    private final PetWalkMeetupRequestRepository meetupRequestRepository;
    private final PetWalkSessionRepository walkSessionRepository;

    public ListJoinedPetWalkSessionsUseCase(
            PetWalkMeetupRequestRepository meetupRequestRepository,
            PetWalkSessionRepository walkSessionRepository) {
        this.meetupRequestRepository = meetupRequestRepository;
        this.walkSessionRepository = walkSessionRepository;
    }

    public List<PetWalkSession> execute(Long actorId) {
        Set<Long> acceptedSessionIds = new LinkedHashSet<>();
        meetupRequestRepository.findByRequesterUserIdOrderByCreatedAtDesc(actorId).forEach(request -> {
            if (request.getStatus() == PetWalkMeetupStatus.ACCEPTED) {
                acceptedSessionIds.add(request.getWalkSessionId());
            }
        });

        List<PetWalkSession> sessions = new ArrayList<>();
        for (Long sessionId : acceptedSessionIds) {
            walkSessionRepository.findById(sessionId).ifPresent(sessions::add);
        }
        return sessions;
    }
}
