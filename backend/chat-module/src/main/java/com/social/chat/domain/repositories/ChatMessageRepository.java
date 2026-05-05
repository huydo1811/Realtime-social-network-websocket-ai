package com.social.chat.domain.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.social.chat.domain.entities.ChatMessage;

public interface ChatMessageRepository {
    ChatMessage save(ChatMessage message);

    Optional<ChatMessage> findById(Long id);

    Optional<ChatMessage> findByIdempotencyKey(Long conversationId, Long senderId, String idempotencyKey);

    Page<ChatMessage> findByConversationId(Long conversationId, Pageable pageable);
    
    Page<ChatMessage> findByConversationIdWithCursor(Long conversationId, Long cursorId, Pageable pageable);

    java.util.Map<Long, Integer> countUnreadMessagesByConversationIds(java.util.Collection<Long> conversationIds, Long actorId);

    void markAllAsRead(Long conversationId, Long actorId);
}
