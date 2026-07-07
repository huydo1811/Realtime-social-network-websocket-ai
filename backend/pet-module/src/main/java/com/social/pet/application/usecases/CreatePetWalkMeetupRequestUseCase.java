package com.social.pet.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.domain.entities.PetWalkMeetupRequest;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.entities.PetWalkSessionStatus;
import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.repositories.PetWalkMeetupRequestRepository;
import com.social.pet.domain.repositories.PetWalkSessionRepository;

@Service
public class CreatePetWalkMeetupRequestUseCase {
    private final PetWalkSessionRepository walkSessionRepository;
    private final PetWalkMeetupRequestRepository meetupRequestRepository;

    public CreatePetWalkMeetupRequestUseCase(
            PetWalkSessionRepository walkSessionRepository,
            PetWalkMeetupRequestRepository meetupRequestRepository) {
        this.walkSessionRepository = walkSessionRepository;
        this.meetupRequestRepository = meetupRequestRepository;
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
        return meetupRequestRepository.save(request);
    }
}