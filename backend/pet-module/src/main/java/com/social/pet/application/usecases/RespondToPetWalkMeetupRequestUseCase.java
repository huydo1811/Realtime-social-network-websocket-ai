package com.social.pet.application.usecases;

import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.social.pet.domain.entities.PetWalkMeetupRequest;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.repositories.PetWalkMeetupRequestRepository;
import com.social.pet.domain.repositories.PetWalkSessionRepository;
import com.social.pet.infrastructure.realtime.PetWalkRealtimeEvent;
import com.social.pet.infrastructure.realtime.PetWalkRealtimePublisher;

@Service
public class RespondToPetWalkMeetupRequestUseCase {
    private final PetWalkMeetupRequestRepository meetupRequestRepository;
    private final PetWalkSessionRepository walkSessionRepository;
    private final PetWalkRealtimePublisher realtimePublisher;

    public RespondToPetWalkMeetupRequestUseCase(
            PetWalkMeetupRequestRepository meetupRequestRepository,
            PetWalkSessionRepository walkSessionRepository,
            PetWalkRealtimePublisher realtimePublisher) {
        this.meetupRequestRepository = meetupRequestRepository;
        this.walkSessionRepository = walkSessionRepository;
        this.realtimePublisher = realtimePublisher;
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
        PetWalkMeetupRequest saved = meetupRequestRepository.save(request);
        PetWalkRealtimeEvent event = PetWalkRealtimeEvent.of(
                accepted ? "pet.walk.meetup.accepted" : "pet.walk.meetup.declined",
                session.getId(),
                saved.getId(),
                actorId,
                request.getRequesterUserId(),
                session.getPetId(),
                saved.getStatus().name()
        );
        Set<Long> recipients = new LinkedHashSet<>();
        recipients.add(actorId);
        recipients.add(request.getRequesterUserId());
        publishAfterCommit(event, recipients);
        return saved;
    }

    private void publishAfterCommit(PetWalkRealtimeEvent event, Set<Long> recipients) {
        if (event == null || recipients == null || recipients.isEmpty()) {
            return;
        }
        Runnable publish = () -> realtimePublisher.publishToUsers(
                event,
                recipients.toArray(Long[]::new)
        );
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publish.run();
                }
            });
            return;
        }
        publish.run();
    }
}