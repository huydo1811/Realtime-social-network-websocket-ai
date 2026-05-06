package com.social.chat.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.chat.domain.entities.ChatConversationReadStatus;
import com.social.chat.domain.repositories.ChatConversationReadStatusRepository;

@Repository
public class ChatConversationReadStatusRepositoryImpl implements ChatConversationReadStatusRepository {

    private final JpaChatConversationReadStatusRepository jpaRepository;

    public ChatConversationReadStatusRepositoryImpl(JpaChatConversationReadStatusRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<ChatConversationReadStatus> findByConversationIdAndUserId(Long conversationId, Long userId) {
        return jpaRepository.findByConversationIdAndUserId(conversationId, userId);
    }

    @Override
    public ChatConversationReadStatus save(ChatConversationReadStatus status) {
        return jpaRepository.save(status);
    }

    @Override
    public List<ChatConversationReadStatus> findByConversationId(Long conversationId) {
        return jpaRepository.findByConversationId(conversationId);
    }
}
