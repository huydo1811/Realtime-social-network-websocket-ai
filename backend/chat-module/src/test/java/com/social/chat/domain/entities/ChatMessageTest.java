package com.social.chat.domain.entities;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import com.social.chat.domain.exceptions.ChatPermissionDeniedException;
import com.social.chat.domain.exceptions.InvalidMessageException;

class ChatMessageTest {

    @Test
    void shouldEditMessageBySender() {
        ChatConversation c = ChatConversation.privateConversation(1L, 2L);
        ChatMessage m = ChatMessage.create(c, 1L, "Hello", "k1", null);

        m.editBy(1L, "Hello edited");

        assertEquals("Hello edited", m.getContent());
    }

    @Test
    void shouldRejectEditByOtherUser() {
        ChatConversation c = ChatConversation.privateConversation(1L, 2L);
        ChatMessage m = ChatMessage.create(c, 1L, "Hello", "k1", null);

        assertThrows(ChatPermissionDeniedException.class, () -> m.editBy(2L, "hack"));
    }

    @Test
    void shouldRejectBlankContent() {
        ChatConversation c = ChatConversation.privateConversation(1L, 2L);
        ChatMessage m = ChatMessage.create(c, 1L, "Hello", null, null);

        assertThrows(InvalidMessageException.class, () -> m.editBy(1L, "   "));
    }
}
