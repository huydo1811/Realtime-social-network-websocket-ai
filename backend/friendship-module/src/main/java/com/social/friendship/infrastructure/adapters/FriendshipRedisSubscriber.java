package com.social.friendship.infrastructure.adapters;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.social.friendship.domain.events.FriendshipRealtimeEvent;

@Component
public class FriendshipRedisSubscriber {

    private static final Logger log = LoggerFactory.getLogger(FriendshipRedisSubscriber.class);

    private final SimpMessagingTemplate messagingTemplate;

    public FriendshipRedisSubscriber(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void onMessage(FriendshipRealtimeEvent event) {
        if (event == null) {
            return;
        }
        try {
            Long actorId = event.getActorId();
            Long targetUserId = event.getTargetUserId();
            if (actorId != null) {
                messagingTemplate.convertAndSend(topicFor(actorId), event);
            }
            if (targetUserId != null && !targetUserId.equals(actorId)) {
                messagingTemplate.convertAndSend(topicFor(targetUserId), event);
            }
        } catch (Exception ex) {
            log.warn("Failed to broadcast friendship event {} over websocket", event.getEventName(), ex);
        }
    }

    private static String topicFor(Long userId) {
        return "/topic/friendships/users/" + userId;
    }
}
