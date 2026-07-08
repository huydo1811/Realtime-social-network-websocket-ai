package com.social.pet.infrastructure.realtime;

import java.util.LinkedHashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class PetWalkRealtimePublisher {
    private static final Logger log = LoggerFactory.getLogger(PetWalkRealtimePublisher.class);
    private final SimpMessagingTemplate messagingTemplate;

    public PetWalkRealtimePublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishToUsers(PetWalkRealtimeEvent event, Long... userIds) {
        if (event == null || userIds == null) {
            return;
        }
        Set<Long> dedup = new LinkedHashSet<>();
        for (Long userId : userIds) {
            if (userId != null) {
                dedup.add(userId);
            }
        }
        for (Long userId : dedup) {
            messagingTemplate.convertAndSend(topicFor(userId), event);
            log.info("Published pet walk event {} to user {}", event.eventName(), userId);
        }
    }

    private static String topicFor(Long userId) {
        return "/topic/pet-walk/users/" + userId;
    }
}
