package com.social.chat.application.usecases;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.domain.entities.ChatConversationReadStatus;
import com.social.chat.domain.events.ChatRealtimeEvent;
import com.social.chat.domain.repositories.ChatConversationReadStatusRepository;
import com.social.chat.domain.repositories.ChatMessageRepository;

@Service
public class UpdateConversationReadStatusUseCase {

    private final ChatConversationReadStatusRepository readStatusRepository;
    private final ChatMessageRepository messageRepository;
    private final ApplicationEventPublisher springEventPublisher;

    public UpdateConversationReadStatusUseCase(ChatConversationReadStatusRepository readStatusRepository,
                                               ChatMessageRepository messageRepository,
                                               ApplicationEventPublisher springEventPublisher) {
        this.readStatusRepository = readStatusRepository;
        this.messageRepository = messageRepository;
        this.springEventPublisher = springEventPublisher;
    }

    @Transactional
    public void execute(Long conversationId, Long actorId) {
        Long latestMessageId = messageRepository.findLatestMessageId(conversationId);
        if (latestMessageId == null) {
            return;
        }
        ChatConversationReadStatus status = readStatusRepository
            .findByConversationIdAndUserId(conversationId, actorId)
            .orElseGet(() -> ChatConversationReadStatus.create(conversationId, actorId, latestMessageId));
        status.advance(latestMessageId);
        ChatConversationReadStatus saved = readStatusRepository.save(status);

        ChatRealtimeEvent event = new ChatRealtimeEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventName("chat.conversation.read");
        event.setConversationId(conversationId);
        event.setReaderId(actorId);
        event.setLastReadMessageId(saved.getLastReadMessageId());
        event.setOccurredAt(LocalDateTime.now());
        springEventPublisher.publishEvent(event);
    }
}
