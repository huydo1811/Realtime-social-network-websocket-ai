package com.social.chat.infrastructure.adapters;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.social.chat.domain.events.ChatRealtimeEvent;

class ChatRedisSubscriberTest {

    @Test
    void shouldNotPublishDuplicateEventId() {
        SimpMessagingTemplate template = mock(SimpMessagingTemplate.class);
        ChatRedisSubscriber subscriber = new ChatRedisSubscriber(template);

        ChatRealtimeEvent event = new ChatRealtimeEvent();
        event.setEventId("evt-1");
        event.setConversationId(100L);
        event.setEventName("chat.message.sent");

        subscriber.onMessage(event);
        subscriber.onMessage(event);

        verify(template, times(1)).convertAndSend("/topic/chat/conversations/100", event);
    }
}
