package com.social.chat.application.usecases;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.application.services.ChatPermissionService;
import com.social.chat.domain.entities.ChatMessage;
import com.social.chat.domain.events.ChatEventPublisher;
import com.social.chat.domain.events.ChatRealtimeEvent;
import com.social.chat.domain.exceptions.ConversationNotFoundException;
import com.social.chat.domain.exceptions.MessageNotFoundException;
import com.social.chat.domain.repositories.ChatConversationRepository;
import com.social.chat.domain.repositories.ChatMessageRepository;

@Service
public class ToggleMessageStarUseCase {

    private final ChatMessageRepository messageRepository;
    private final ChatConversationRepository conversationRepository;
    private final ChatPermissionService permissionService;
    private final ChatEventPublisher eventPublisher;

    public ToggleMessageStarUseCase(ChatMessageRepository messageRepository,
            ChatConversationRepository conversationRepository,
            ChatPermissionService permissionService,
            ChatEventPublisher eventPublisher) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.permissionService = permissionService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public ChatMessage execute(Long actorId, Long messageId) {
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new MessageNotFoundException(messageId));

        Long conversationId = message.getConversation().getId();
        var conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ConversationNotFoundException(conversationId));
        permissionService.ensureConversationMember(conversation, actorId);

        message.toggleStar();
        ChatMessage saved = messageRepository.save(message);

        ChatRealtimeEvent event = new ChatRealtimeEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventName("chat.message.starred");
        event.setConversationId(conversationId);
        event.setMessageId(saved.getId());
        event.setSenderId(saved.getSenderId());
        event.setContent(saved.getContent());
        event.setCreatedAt(saved.getCreatedAt());
        event.setReplyToMessageId(saved.getReplyToMessageId());
        event.setStarred(saved.getStarred());
        event.setOccurredAt(LocalDateTime.now());
        eventPublisher.publish(event);

        return saved;
    }
}
