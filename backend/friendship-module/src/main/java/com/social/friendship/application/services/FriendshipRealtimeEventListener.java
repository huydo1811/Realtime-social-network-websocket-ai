package com.social.friendship.application.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.social.friendship.domain.events.FriendshipEventPublisher;
import com.social.friendship.domain.events.FriendshipRealtimeEvent;

@Component
public class FriendshipRealtimeEventListener {

    private static final Logger log = LoggerFactory.getLogger(FriendshipRealtimeEventListener.class);

    private final FriendshipEventPublisher eventPublisher;

    public FriendshipRealtimeEventListener(FriendshipEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(FriendshipRealtimeEvent event) {
        try {
            eventPublisher.publish(event);
        } catch (Exception ex) {
            log.error("Failed to publish friendship event {}", event.getEventName(), ex);
        }
    }
}
