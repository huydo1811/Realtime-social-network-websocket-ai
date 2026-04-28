package com.social.chat.application.services;

import org.springframework.stereotype.Service;

import com.social.chat.domain.entities.ChatConversation;
import com.social.chat.domain.exceptions.ChatPermissionDeniedException;

@Service
public class ChatPermissionService {

    public void ensureConversationMember(ChatConversation conversation, Long userId) {
        if (conversation == null || userId == null || !conversation.hasMember(userId)) {
            throw new ChatPermissionDeniedException("Bạn không có quyền truy cập conversation này");
        }
    }
}
