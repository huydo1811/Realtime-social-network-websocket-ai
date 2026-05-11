package com.social.call.infrastructure.adapters;

import java.util.Objects;

import org.springframework.beans.factory.annotation.Qualifier;
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
import com.social.call.domain.events.CallRealtimeEvent;

@Configuration
public class CallRedisConfig {

    @Bean
    public ChannelTopic callEventsTopic() {
        return new ChannelTopic("call:events:v1");
    }

    @Bean
    public RedisTemplate<String, CallRealtimeEvent> callEventRedisTemplate(@NonNull RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, CallRealtimeEvent> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        Jackson2JsonRedisSerializer<CallRealtimeEvent> serializer =
                new Jackson2JsonRedisSerializer<>(mapper, CallRealtimeEvent.class);

        template.setValueSerializer(serializer);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public MessageListenerAdapter callMessageListenerAdapter(@NonNull CallRedisSubscriber subscriber) {
        MessageListenerAdapter adapter = new MessageListenerAdapter(Objects.requireNonNull(subscriber), "onMessage");

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        Jackson2JsonRedisSerializer<CallRealtimeEvent> serializer =
                new Jackson2JsonRedisSerializer<>(mapper, CallRealtimeEvent.class);
        adapter.setSerializer(serializer);
        return adapter;
    }

    @Bean
    public RedisMessageListenerContainer callRedisMessageListenerContainer(
            @NonNull RedisConnectionFactory connectionFactory,
            @NonNull MessageListenerAdapter callMessageListenerAdapter,
            @NonNull @Qualifier("callEventsTopic") ChannelTopic callEventsTopic) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(Objects.requireNonNull(connectionFactory));
        container.addMessageListener(Objects.requireNonNull(callMessageListenerAdapter), Objects.requireNonNull(callEventsTopic));
        return container;
    }
}
