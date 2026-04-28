package com.social.chat.infrastructure.adapters;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Component;

import com.social.chat.domain.events.ChatEventPublisher;
import com.social.chat.domain.events.ChatRealtimeEvent;

@Component
public class RedisChatEventPublisher implements ChatEventPublisher {

    private final RedisTemplate<String, ChatRealtimeEvent> redisTemplate;
    private final ChannelTopic channelTopic;

    public RedisChatEventPublisher(RedisTemplate<String, ChatRealtimeEvent> redisTemplate,
                                   ChannelTopic channelTopic) {
        this.redisTemplate = redisTemplate;
        this.channelTopic = channelTopic;
    }

    @Override
    public void publish(ChatRealtimeEvent event) {
        redisTemplate.convertAndSend(channelTopic.getTopic(), event);
    }
}
