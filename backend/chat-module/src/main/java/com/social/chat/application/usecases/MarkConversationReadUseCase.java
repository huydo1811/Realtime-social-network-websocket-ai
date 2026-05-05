package com.social.chat.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.domain.repositories.ChatMessageRepository;

@Service
public class MarkConversationReadUseCase {

    private final ChatMessageRepository messageRepository;

    public MarkConversationReadUseCase(ChatMessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @Transactional
    public void execute(Long conversationId, Long actorId) {
        messageRepository.markAllAsRead(conversationId, actorId);
    }
}