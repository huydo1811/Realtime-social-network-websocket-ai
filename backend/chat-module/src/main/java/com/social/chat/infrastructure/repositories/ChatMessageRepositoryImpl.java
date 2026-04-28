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
}
