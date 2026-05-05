package com.social.chat.application.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.social.chat.domain.events.ChatEventPublisher;
import com.social.chat.domain.events.ChatRealtimeEvent;

@Component
public class ChatRealtimeEventListener {

    private static final Logger log = LoggerFactory.getLogger(ChatRealtimeEventListener.class);
    private final ChatEventPublisher eventPublisher;

    public ChatRealtimeEventListener(ChatEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleChatRealtimeEvent(ChatRealtimeEvent event) {
        try {
            log.info("Publishing realtime event {} after commit for message {}", event.getEventName(), event.getMessageId());
            eventPublisher.publish(event);
        } catch (Exception e) {
            log.error("Failed to publish realtime event {} for message {}", event.getEventName(), event.getMessageId(), e);
        }
    }
}
