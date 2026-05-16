package com.social.friendship.infrastructure.adapters;

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
import com.social.friendship.domain.events.FriendshipRealtimeEvent;

@Configuration
public class FriendshipRedisConfig {

    @Bean
    public ChannelTopic friendshipEventsTopic() {
        return new ChannelTopic("friendship:events:v1");
    }

    @Bean
    public RedisTemplate<String, FriendshipRealtimeEvent> friendshipEventRedisTemplate(
            @NonNull RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, FriendshipRealtimeEvent> template = new RedisTemplate<>();
        template.setConnectionFactory(Objects.requireNonNull(connectionFactory));
        template.setKeySerializer(new StringRedisSerializer());

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        Jackson2JsonRedisSerializer<FriendshipRealtimeEvent> serializer =
                new Jackson2JsonRedisSerializer<>(mapper, FriendshipRealtimeEvent.class);
        template.setValueSerializer(serializer);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public MessageListenerAdapter friendshipMessageListenerAdapter(
            @NonNull FriendshipRedisSubscriber subscriber) {
        MessageListenerAdapter adapter =
                new MessageListenerAdapter(Objects.requireNonNull(subscriber), "onMessage");

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        Jackson2JsonRedisSerializer<FriendshipRealtimeEvent> serializer =
                new Jackson2JsonRedisSerializer<>(mapper, FriendshipRealtimeEvent.class);
        adapter.setSerializer(serializer);
        return adapter;
    }

    @Bean
    public RedisMessageListenerContainer friendshipRedisMessageListenerContainer(
            @NonNull RedisConnectionFactory connectionFactory,
            @NonNull @Qualifier("friendshipMessageListenerAdapter") MessageListenerAdapter friendshipMessageListenerAdapter,
            @NonNull @Qualifier("friendshipEventsTopic") ChannelTopic friendshipEventsTopic) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(Objects.requireNonNull(connectionFactory));
        container.addMessageListener(
                Objects.requireNonNull(friendshipMessageListenerAdapter),
                Objects.requireNonNull(friendshipEventsTopic));
        return container;
    }
}
