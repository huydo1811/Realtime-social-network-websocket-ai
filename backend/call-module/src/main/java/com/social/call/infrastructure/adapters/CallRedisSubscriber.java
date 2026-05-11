package com.social.call.infrastructure.adapters;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import com.social.call.domain.constants.CallWebSocketDestinations;
import com.social.call.domain.events.CallRealtimeEvent;

@Component
public class CallRedisSubscriber {

    private static final long DEDUP_TTL_MILLIS = 60_000;
    private final SimpMessagingTemplate messagingTemplate;
    private final ConcurrentMap<String, Long> recentEventIds = new ConcurrentHashMap<>();

    public CallRedisSubscriber(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Async("callAsyncExecutor")
    public void onMessage(CallRealtimeEvent event) {
        if (event == null) {
            return;
        }
        cleanupExpired();
        if (isDuplicate(event.getEventId())) {
            return;
        }

        if (event.getFromUserId() != null) {
            messagingTemplate.convertAndSend(CallWebSocketDestinations.USER_TOPIC_PREFIX + event.getFromUserId(), event);
        }
        if (event.getToUserId() != null && !event.getToUserId().equals(event.getFromUserId())) {
            messagingTemplate.convertAndSend(CallWebSocketDestinations.USER_TOPIC_PREFIX + event.getToUserId(), event);
        }
        if (event.getCallId() != null && !event.getCallId().isBlank()) {
            messagingTemplate.convertAndSend(CallWebSocketDestinations.SESSION_TOPIC_PREFIX + event.getCallId(), event);
        }
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
