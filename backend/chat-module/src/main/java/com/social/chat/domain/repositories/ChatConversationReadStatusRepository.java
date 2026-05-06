package com.social.chat.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.chat.domain.entities.ChatConversationReadStatus;

public interface ChatConversationReadStatusRepository {
    Optional<ChatConversationReadStatus> findByConversationIdAndUserId(Long conversationId, Long userId);

    ChatConversationReadStatus save(ChatConversationReadStatus status);

    List<ChatConversationReadStatus> findByConversationId(Long conversationId);
}
