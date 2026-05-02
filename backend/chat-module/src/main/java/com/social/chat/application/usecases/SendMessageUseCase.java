package com.social.chat.application.usecases;

import java.time.LocalDateTime;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.application.services.ChatPermissionService;
import com.social.chat.domain.entities.ChatConversation;
import com.social.chat.domain.entities.ChatMessage;
import com.social.chat.domain.events.ChatEventPublisher;
import com.social.chat.domain.events.ChatRealtimeEvent;
import com.social.chat.domain.exceptions.ConversationNotFoundException;
import com.social.chat.domain.repositories.ChatConversationRepository;
import com.social.chat.domain.repositories.ChatMessageRepository;

@Service
public class SendMessageUseCase {

    private static final Logger log = LoggerFactory.getLogger(SendMessageUseCase.class);

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatPermissionService permissionService;
    private final ApplicationEventPublisher springEventPublisher;

    public SendMessageUseCase(ChatConversationRepository conversationRepository,
                              ChatMessageRepository messageRepository,
                              ChatPermissionService permissionService,
                              ApplicationEventPublisher springEventPublisher) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.permissionService = permissionService;
        this.springEventPublisher = springEventPublisher;
    }

    @Transactional
    public ChatMessage execute(Long actorId, Long conversationId, String content, String idempotencyKey) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));

        permissionService.ensureConversationMember(conversation, actorId);

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var existing = messageRepository.findByIdempotencyKey(conversationId, actorId, idempotencyKey.trim());
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        ChatMessage saved = messageRepository.save(ChatMessage.create(conversation, actorId, content, idempotencyKey));

        ChatRealtimeEvent event = new ChatRealtimeEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventName("chat.message.sent");
        event.setConversationId(conversationId);
        event.setMessageId(saved.getId());
        event.setSenderId(saved.getSenderId());
        event.setContent(saved.getContent());
        event.setCreatedAt(saved.getCreatedAt());
        event.setOccurredAt(LocalDateTime.now());
        
        // Push event internally, then an AFTER_COMMIT listener will handle it.
        springEventPublisher.publishEvent(event);
        log.info("Message sent successfully, id: {} in conversation: {}", saved.getId(), conversationId);

        return saved;
    }
}
