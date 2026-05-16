package com.social.friendship.infrastructure.adapters;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Component;

import com.social.friendship.domain.events.FriendshipEventPublisher;
import com.social.friendship.domain.events.FriendshipRealtimeEvent;

@Component
public class RedisFriendshipEventPublisher implements FriendshipEventPublisher {

    private final RedisTemplate<String, FriendshipRealtimeEvent> redisTemplate;
    private final ChannelTopic channelTopic;

    public RedisFriendshipEventPublisher(
            RedisTemplate<String, FriendshipRealtimeEvent> redisTemplate,
            @Qualifier("friendshipEventsTopic") ChannelTopic channelTopic) {
        this.redisTemplate = redisTemplate;
        this.channelTopic = channelTopic;
    }

    @Override
    public void publish(FriendshipRealtimeEvent event) {
        redisTemplate.convertAndSend(channelTopic.getTopic(), event);
    }
}
