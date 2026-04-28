package com.social.chat.domain.events;

public interface ChatEventPublisher {
    void publish(ChatRealtimeEvent event);
}
