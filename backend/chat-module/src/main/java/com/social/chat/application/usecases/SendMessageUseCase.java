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
import com.social.chat.domain.events.ChatRealtimeEvent;
import com.social.chat.domain.exceptions.ConversationNotFoundException;
import com.social.chat.domain.exceptions.InvalidMessageException;
import com.social.chat.domain.exceptions.MessageNotFoundException;
import com.social.chat.domain.repositories.ChatConversationRepository;
import com.social.chat.domain.repositories.ChatMessageRepository;
import com.social.chat.domain.repositories.ChatUserBlockRepository;

@Service
public class SendMessageUseCase {

    private static final Logger log = LoggerFactory.getLogger(SendMessageUseCase.class);

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatPermissionService permissionService;
    private final ApplicationEventPublisher springEventPublisher;
    private final ChatUserBlockRepository chatUserBlockRepository;

    public SendMessageUseCase(ChatConversationRepository conversationRepository,
                              ChatMessageRepository messageRepository,
                              ChatPermissionService permissionService,
                              ApplicationEventPublisher springEventPublisher,
                              ChatUserBlockRepository chatUserBlockRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.permissionService = permissionService;
        this.springEventPublisher = springEventPublisher;
        this.chatUserBlockRepository = chatUserBlockRepository;
    }

    @Transactional
    public ChatMessage execute(Long actorId, Long conversationId, String content, String idempotencyKey, Long replyToMessageId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));

        permissionService.ensureConversationMember(conversation, actorId);
        if (conversation.getType() == com.social.chat.domain.entities.ConversationType.PRIVATE
                && conversation.getMemberIds().size() >= 2) {
            Long peerId = conversation.getMemberIds().stream()
                    .filter(memberId -> !memberId.equals(actorId))
                    .findFirst()
                    .orElse(null);
            if (peerId != null) {
                if (chatUserBlockRepository.exists(actorId, peerId)) {
                    throw new InvalidMessageException("Bạn đã chặn người dùng này. Hãy bỏ chặn để nhắn tin.");
                }
                if (chatUserBlockRepository.exists(peerId, actorId)) {
                    throw new InvalidMessageException("Bạn không thể gửi tin nhắn vì đã bị chặn.");
                }
            }
        }

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var existing = messageRepository.findByIdempotencyKey(conversationId, actorId, idempotencyKey.trim());
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        if (replyToMessageId != null) {
            ChatMessage replyTo = messageRepository.findById(replyToMessageId)
                .orElseThrow(() -> new MessageNotFoundException(replyToMessageId));
            if (!replyTo.getConversation().getId().equals(conversationId)) {
                throw new InvalidMessageException("Tin nhắn trả lời không thuộc cùng cuộc trò chuyện");
            }
        }

        ChatMessage saved = messageRepository.save(ChatMessage.create(conversation, actorId, content, idempotencyKey, replyToMessageId));

        ChatRealtimeEvent event = new ChatRealtimeEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventName("chat.message.sent");
        event.setConversationId(conversationId);
        event.setMessageId(saved.getId());
        event.setSenderId(saved.getSenderId());
        event.setContent(saved.getContent());
        event.setCreatedAt(saved.getCreatedAt());
        event.setReplyToMessageId(saved.getReplyToMessageId());
        event.setStarred(saved.getStarred());
        event.setOccurredAt(LocalDateTime.now());
        
        // Push event internally, then an AFTER_COMMIT listener will handle it.
        springEventPublisher.publishEvent(event);
        log.info("Message sent successfully, id: {} in conversation: {}", saved.getId(), conversationId);

        return saved;
    }
}
