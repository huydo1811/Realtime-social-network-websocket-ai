package com.social.chat.application.usecases;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.social.chat.application.services.ChatPermissionService;
import com.social.chat.domain.events.ChatEventPublisher;
import com.social.chat.domain.events.ChatRealtimeEvent;
import com.social.chat.domain.exceptions.ConversationNotFoundException;
import com.social.chat.domain.repositories.ChatConversationRepository;

@Service
public class PublishTypingStatusUseCase {

    private final ChatConversationRepository conversationRepository;
    private final ChatPermissionService permissionService;
    private final ChatEventPublisher eventPublisher;

    public PublishTypingStatusUseCase(ChatConversationRepository conversationRepository,
                                      ChatPermissionService permissionService,
                                      ChatEventPublisher eventPublisher) {
        this.conversationRepository = conversationRepository;
        this.permissionService = permissionService;
        this.eventPublisher = eventPublisher;
    }

    public void execute(Long actorId, Long conversationId, boolean typing) {
        var conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));
        permissionService.ensureConversationMember(conversation, actorId);

        ChatRealtimeEvent event = new ChatRealtimeEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventName("chat.typing");
        event.setConversationId(conversationId);
        event.setSenderId(actorId);
        event.setStarred(false);
        event.setTyping(typing);
        event.setOccurredAt(LocalDateTime.now());
        eventPublisher.publish(event);
    }
}
