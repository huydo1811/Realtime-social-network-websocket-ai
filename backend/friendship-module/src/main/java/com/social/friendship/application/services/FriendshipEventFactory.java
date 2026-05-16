package com.social.friendship.application.services;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.events.FriendshipRealtimeEvent;

@Component
public class FriendshipEventFactory {

    public FriendshipRealtimeEvent create(String eventName, Long actorId, Long targetUserId, Friendship friendship) {
        FriendshipRealtimeEvent event = new FriendshipRealtimeEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventName(eventName);
        event.setActorId(actorId);
        event.setTargetUserId(targetUserId);
        event.setFriendshipId(friendship.getId());
        event.setStatus(friendship.getStatus());
        event.setOccurredAt(LocalDateTime.now());
        return event;
    }
}
