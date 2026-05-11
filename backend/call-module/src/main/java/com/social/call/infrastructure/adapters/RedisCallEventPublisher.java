package com.social.call.infrastructure.adapters;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Component;

import com.social.call.domain.events.CallEventPublisher;
import com.social.call.domain.events.CallRealtimeEvent;

@Component
public class RedisCallEventPublisher implements CallEventPublisher {

    private final RedisTemplate<String, CallRealtimeEvent> redisTemplate;
    private final ChannelTopic channelTopic;

    public RedisCallEventPublisher(RedisTemplate<String, CallRealtimeEvent> redisTemplate,
            @Qualifier("callEventsTopic") ChannelTopic channelTopic) {
        this.redisTemplate = redisTemplate;
        this.channelTopic = channelTopic;
    }

    @Override
    public void publish(CallRealtimeEvent event) {
        redisTemplate.convertAndSend(channelTopic.getTopic(), event);
    }
}
