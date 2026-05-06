package com.social.chat.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.chat.domain.entities.ChatConversationReadStatus;
import com.social.chat.domain.entities.ChatConversationReadStatus.ChatConversationReadStatusId;

public interface JpaChatConversationReadStatusRepository
        extends JpaRepository<ChatConversationReadStatus, ChatConversationReadStatusId> {
    Optional<ChatConversationReadStatus> findByConversationIdAndUserId(Long conversationId, Long userId);

    List<ChatConversationReadStatus> findByConversationId(Long conversationId);
}
