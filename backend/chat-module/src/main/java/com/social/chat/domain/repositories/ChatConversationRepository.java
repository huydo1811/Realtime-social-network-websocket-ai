package com.social.chat.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.chat.domain.entities.ChatConversation;

public interface ChatConversationRepository {
    ChatConversation save(ChatConversation conversation);

    Optional<ChatConversation> findById(Long conversationId);

    Optional<ChatConversation> findByIdAndMemberId(Long conversationId, Long memberId);

    Optional<ChatConversation> findPrivateConversation(Long userA, Long userB);

    Optional<ChatConversation> findSelfConversation(Long userId);

    List<ChatConversation> findByMemberId(Long memberId);

    Optional<ChatConversation> findByIdempotencyKey(Long creatorId, String idempotencyKey);
}