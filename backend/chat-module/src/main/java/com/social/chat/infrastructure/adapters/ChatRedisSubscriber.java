package com.social.chat.infrastructure.adapters;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.social.chat.domain.events.ChatRealtimeEvent;

@Component
public class ChatRedisSubscriber {

    private static final long DEDUP_TTL_MILLIS = 60_000;

    private final SimpMessagingTemplate messagingTemplate;
    private final ConcurrentMap<String, Long> recentEventIds = new ConcurrentHashMap<>();

    public ChatRedisSubscriber(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void onMessage(ChatRealtimeEvent event) {
        if (event == null || event.getConversationId() == null) {
            return;
        }

        cleanupExpired();
        if (isDuplicate(event.getEventId())) {
            return;
        }

        String destination = "/topic/chat/conversations/" + event.getConversationId();
        messagingTemplate.convertAndSend(destination, event);
    }

    private boolean isDuplicate(String eventId) {
        if (eventId == null || eventId.isBlank()) {
            return false;
        }
        return recentEventIds.putIfAbsent(eventId, System.currentTimeMillis()) != null;
    }

    private void cleanupExpired() {
        long now = System.currentTimeMillis();
        recentEventIds.entrySet().removeIf(e -> now - e.getValue() > DEDUP_TTL_MILLIS);
    }
}
