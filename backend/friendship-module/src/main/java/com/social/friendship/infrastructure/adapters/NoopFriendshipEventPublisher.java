package com.social.friendship.infrastructure.adapters;

import org.springframework.stereotype.Component;

import com.social.friendship.domain.events.FriendshipEventPublisher;
import com.social.friendship.domain.events.FriendshipRealtimeEvent;

@Component
public class NoopFriendshipEventPublisher implements FriendshipEventPublisher {
    @Override
    public void publish(FriendshipRealtimeEvent event) {
        // Reserved for future websocket/redis integration.
    }
}
