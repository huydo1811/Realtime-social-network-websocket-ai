package com.social.call.domain.events;

public interface CallEventPublisher {
    void publish(CallRealtimeEvent event);
}
