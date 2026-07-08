package com.social.pet.application.usecases;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.social.pet.application.services.PetOwnerService;
import com.social.pet.domain.entities.PetWalkMeetupStatus;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.repositories.PetWalkMeetupRequestRepository;
import com.social.pet.domain.repositories.PetWalkSessionRepository;
import com.social.pet.infrastructure.realtime.PetWalkRealtimeEvent;
import com.social.pet.infrastructure.realtime.PetWalkRealtimePublisher;

@Service
public class FinishPetWalkSessionUseCase {
    private final PetOwnerService petOwnerService;
    private final PetWalkSessionRepository walkSessionRepository;
    private final PetWalkMeetupRequestRepository meetupRequestRepository;
    private final PetWalkRealtimePublisher realtimePublisher;

    public FinishPetWalkSessionUseCase(
            PetOwnerService petOwnerService,
            PetWalkSessionRepository walkSessionRepository,
            PetWalkMeetupRequestRepository meetupRequestRepository,
            PetWalkRealtimePublisher realtimePublisher) {
        this.petOwnerService = petOwnerService;
        this.walkSessionRepository = walkSessionRepository;
        this.meetupRequestRepository = meetupRequestRepository;
        this.realtimePublisher = realtimePublisher;
    }

    @Transactional
    public PetWalkSession execute(Long actorId, Long petId, Long walkId, Double endLatitude, Double endLongitude) {
        petOwnerService.requireOwnedPet(actorId, petId);
        PetWalkSession session = walkSessionRepository.findById(walkId)
                .orElseThrow(() -> new PetDomainException("Không tìm thấy phiên đi dạo"));
        if (!session.getPetId().equals(petId)) {
            throw new PetDomainException("Phiên đi dạo không thuộc thú cưng này");
        }
        session.finish(actorId, endLatitude, endLongitude);
        PetWalkSession saved = walkSessionRepository.save(session);
        List<Long> participantUserIds = meetupRequestRepository.findByWalkSessionIdOrderByCreatedAtDesc(saved.getId())
                .stream()
                .filter(request -> request.getStatus() == PetWalkMeetupStatus.ACCEPTED)
                .map(request -> request.getRequesterUserId())
                .distinct()
                .toList();

        Set<Long> recipients = new LinkedHashSet<>();
        recipients.add(session.getCreatedByUserId());
        recipients.addAll(participantUserIds);

        PetWalkRealtimeEvent event = PetWalkRealtimeEvent.of(
                "pet.walk.session.finished",
                saved.getId(),
                null,
                actorId,
                null,
                petId,
                saved.getStatus().name()
        );
        publishAfterCommit(event, recipients);

        return saved;
    }

    private void publishAfterCommit(PetWalkRealtimeEvent event, Set<Long> recipients) {
        if (recipients.isEmpty()) {
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
