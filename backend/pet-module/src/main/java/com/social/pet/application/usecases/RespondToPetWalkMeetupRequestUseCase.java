package com.social.pet.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.entities.PetWalkMeetupRequest;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.repositories.PetWalkMeetupRequestRepository;
import com.social.pet.domain.repositories.PetWalkSessionRepository;

@Service
public class RespondToPetWalkMeetupRequestUseCase {
    private final PetWalkMeetupRequestRepository meetupRequestRepository;
    private final PetWalkSessionRepository walkSessionRepository;

    public RespondToPetWalkMeetupRequestUseCase(
            PetWalkMeetupRequestRepository meetupRequestRepository,
            PetWalkSessionRepository walkSessionRepository) {
        this.meetupRequestRepository = meetupRequestRepository;
        this.walkSessionRepository = walkSessionRepository;
    }

    @Transactional
    public PetWalkMeetupRequest accept(Long actorId, Long meetupId) {
        return respond(actorId, meetupId, true);
    }

    @Transactional
    public PetWalkMeetupRequest decline(Long actorId, Long meetupId) {
        return respond(actorId, meetupId, false);
    }

    private PetWalkMeetupRequest respond(Long actorId, Long meetupId, boolean accepted) {
        PetWalkMeetupRequest request = meetupRequestRepository.findById(meetupId)
                .orElseThrow(() -> new PetDomainException("Không tìm thấy lời mời gặp gỡ"));
        PetWalkSession session = walkSessionRepository.findById(request.getWalkSessionId())
                .orElseThrow(() -> new PetDomainException("Không tìm thấy phiên đi dạo"));
        if (!session.getCreatedByUserId().equals(actorId)) {
            throw new PetDomainException("Bạn không có quyền xử lý lời mời này");
        }
        if (accepted) {
            request.accept(actorId);
        } else {
            request.decline(actorId);
        }
        return meetupRequestRepository.save(request);
    }
}