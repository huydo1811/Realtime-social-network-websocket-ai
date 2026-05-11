package com.social.chat.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.chat.domain.entities.ChatConversation;
import com.social.chat.domain.repositories.ChatConversationRepository;

@Repository
public class ChatConversationRepositoryImpl implements ChatConversationRepository {

    private final JpaChatConversationRepository jpaRepository;

    public ChatConversationRepositoryImpl(JpaChatConversationRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public ChatConversation save(ChatConversation conversation) {
        return jpaRepository.save(conversation);
    }

    @Override
    public Optional<ChatConversation> findById(Long conversationId) {
        return jpaRepository.findById(conversationId);
    }

    @Override
    public Optional<ChatConversation> findByIdAndMemberId(Long conversationId, Long memberId) {
        return jpaRepository.findByIdAndMemberId(conversationId, memberId);
    }

    @Override
    public Optional<ChatConversation> findPrivateConversation(Long userA, Long userB) {
        return jpaRepository.findPrivateConversation(userA, userB);
    }

    @Override
    public Optional<ChatConversation> findSelfConversation(Long userId) {
        return jpaRepository.findSelfConversation(userId);
    }

    @Override
    public List<ChatConversation> findByMemberId(Long memberId) {
        return jpaRepository.findByMemberId(memberId);
    }

    @Override
    public Optional<ChatConversation> findByIdempotencyKey(Long creatorId, String idempotencyKey) {
        return jpaRepository.findByIdempotencyKey(creatorId, idempotencyKey);
    }

    @Override
    public List<ChatConversation> findAllOrderByRecentActivity() {
        return jpaRepository.findAllOrderByRecentActivity();
    }
}