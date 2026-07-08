package com.social.pet.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.entities.PetWalkMeetupRequest;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.entities.PetWalkSessionStatus;
import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.repositories.PetWalkMeetupRequestRepository;
import com.social.pet.domain.repositories.PetWalkSessionRepository;
import com.social.pet.infrastructure.realtime.PetWalkRealtimeEvent;
import com.social.pet.infrastructure.realtime.PetWalkRealtimePublisher;

@Service
public class CreatePetWalkMeetupRequestUseCase {
    private final PetWalkSessionRepository walkSessionRepository;
    private final PetWalkMeetupRequestRepository meetupRequestRepository;
    private final PetWalkRealtimePublisher realtimePublisher;

    public CreatePetWalkMeetupRequestUseCase(
            PetWalkSessionRepository walkSessionRepository,
            PetWalkMeetupRequestRepository meetupRequestRepository,
            PetWalkRealtimePublisher realtimePublisher) {
        this.walkSessionRepository = walkSessionRepository;
        this.meetupRequestRepository = meetupRequestRepository;
        this.realtimePublisher = realtimePublisher;
    }

    @Transactional
    public PetWalkMeetupRequest execute(
            Long actorId,
            Long walkSessionId,
            String message,
            Double meetupLatitude,
            Double meetupLongitude) {
        PetWalkSession session = walkSessionRepository.findById(walkSessionId)
                .orElseThrow(() -> new PetDomainException("Không tìm thấy phiên đi dạo"));
        if (session.getStatus() != PetWalkSessionStatus.ACTIVE) {
            throw new PetDomainException("Phiên đi dạo không còn hoạt động");
        }
        if (session.getCreatedByUserId().equals(actorId)) {
            throw new PetDomainException("Không thể gửi lời mời cho chính phiên của bạn");
        }
        PetWalkMeetupRequest request = PetWalkMeetupRequest.create(
                walkSessionId,
                actorId,
                message,
                meetupLatitude,
                meetupLongitude);
        PetWalkMeetupRequest saved = meetupRequestRepository.save(request);
        realtimePublisher.publishToUsers(
                PetWalkRealtimeEvent.of(
                        "pet.walk.meetup.sent",
                        session.getId(),
                        saved.getId(),
                        actorId,
                        session.getCreatedByUserId(),
                        session.getPetId(),
                        saved.getStatus().name()
                ),
                actorId,
                session.getCreatedByUserId()
        );
        return saved;
    }
}