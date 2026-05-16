package com.social.friendship.domain.events;

public interface FriendshipEventPublisher {
    void publish(FriendshipRealtimeEvent event);
}
