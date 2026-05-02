package com.social.chat.infrastructure.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.social.chat.domain.entities.ChatMessage;
import com.social.chat.domain.repositories.ChatMessageRepository;

@Repository
public class ChatMessageRepositoryImpl implements ChatMessageRepository {

    private final JpaChatMessageRepository jpaRepository;

    public ChatMessageRepositoryImpl(JpaChatMessageRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public ChatMessage save(ChatMessage message) {
        return jpaRepository.save(message);
    }

    @Override
    public Optional<ChatMessage> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public Optional<ChatMessage> findByIdempotencyKey(Long conversationId, Long senderId, String idempotencyKey) {
        return jpaRepository.findByIdempotencyKey(conversationId, senderId, idempotencyKey);
    }

    @Override
    public Page<ChatMessage> findByConversationId(Long conversationId, Pageable pageable) {
        return jpaRepository.findByConversationId(conversationId, pageable);
    }

    @Override
    public Page<ChatMessage> findByConversationIdWithCursor(Long conversationId, Long cursorId, Pageable pageable) {
        return jpaRepository.findByConversationIdWithCursor(conversationId, cursorId, pageable);
    }

    @Override
    public java.util.Map<Long, Integer> countUnreadMessagesByConversationIds(java.util.Collection<Long> conversationIds, Long actorId) {
        if (conversationIds == null || conversationIds.isEmpty()) {
            return java.util.Collections.emptyMap();
        }
        java.util.List<Object[]> results = jpaRepository.countUnreadMessagesByConversationIds(conversationIds, actorId);
        java.util.Map<Long, Integer> unreadCounts = new java.util.HashMap<>();
        for (Object[] result : results) {
            Long convId = (Long) result[0];
            Integer count = ((Number) result[1]).intValue();
            unreadCounts.put(convId, count);
        }
        return unreadCounts;
    }
}
