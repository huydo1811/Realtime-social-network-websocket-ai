package com.social.chat.application.usecases;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.domain.entities.ChatUserPresence;
import com.social.chat.domain.events.ChatRealtimeEvent;
import com.social.chat.domain.repositories.ChatUserPresenceRepository;

@Service
public class UpdatePresenceHeartbeatUseCase {

    private final ChatUserPresenceRepository presenceRepository;
    private final ApplicationEventPublisher springEventPublisher;

    public UpdatePresenceHeartbeatUseCase(ChatUserPresenceRepository presenceRepository,
                                          ApplicationEventPublisher springEventPublisher) {
        this.presenceRepository = presenceRepository;
        this.springEventPublisher = springEventPublisher;
    }

    @Transactional
    public ChatUserPresence execute(Long actorId, boolean online) {
        ChatUserPresence presence = presenceRepository.findByUserId(actorId)
            .orElseGet(() -> ChatUserPresence.forUser(actorId));
        presence.heartbeat(online);
        ChatUserPresence saved = presenceRepository.save(presence);

        ChatRealtimeEvent event = new ChatRealtimeEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventName("chat.user.presence");
        event.setTargetUserId(actorId);
        event.setOnline(Boolean.TRUE.equals(saved.getOnline()));
        event.setLastSeenAt(saved.getLastSeenAt());
        event.setOccurredAt(LocalDateTime.now());
        springEventPublisher.publishEvent(event);
        return saved;
    }
}
