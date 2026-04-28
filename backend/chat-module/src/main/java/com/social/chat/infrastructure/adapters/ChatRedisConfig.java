package com.social.chat.infrastructure.adapters;

import java.util.Objects;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.lang.NonNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import com.social.chat.domain.events.ChatRealtimeEvent;

@Configuration
public class ChatRedisConfig {

    @Bean
    public ChannelTopic chatEventsTopic() {
        return new ChannelTopic("chat:events:v1");
    }

    @Bean
    public RedisTemplate<String, ChatRealtimeEvent> chatEventRedisTemplate(
            @NonNull RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, ChatRealtimeEvent> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        Jackson2JsonRedisSerializer<ChatRealtimeEvent> serializer = new Jackson2JsonRedisSerializer<>(mapper,
                ChatRealtimeEvent.class);
        template.setValueSerializer(serializer);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public MessageListenerAdapter chatMessageListenerAdapter(@NonNull ChatRedisSubscriber subscriber) {
        return new MessageListenerAdapter(Objects.requireNonNull(subscriber), "onMessage");
    }

    @Bean
    public RedisMessageListenerContainer chatRedisMessageListenerContainer(
            @NonNull RedisConnectionFactory connectionFactory,
            @NonNull MessageListenerAdapter chatMessageListenerAdapter,
            @NonNull ChannelTopic chatEventsTopic) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(Objects.requireNonNull(connectionFactory));
        container.addMessageListener(Objects.requireNonNull(chatMessageListenerAdapter),
                Objects.requireNonNull(chatEventsTopic));
        return container;
    }
}
