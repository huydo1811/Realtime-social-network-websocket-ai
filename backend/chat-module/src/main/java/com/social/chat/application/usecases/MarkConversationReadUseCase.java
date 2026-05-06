package com.social.chat.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.domain.repositories.ChatMessageRepository;

@Service
public class MarkConversationReadUseCase {

    private final ChatMessageRepository messageRepository;
    private final UpdateConversationReadStatusUseCase updateConversationReadStatusUseCase;

    public MarkConversationReadUseCase(ChatMessageRepository messageRepository,
                                       UpdateConversationReadStatusUseCase updateConversationReadStatusUseCase) {
        this.messageRepository = messageRepository;
        this.updateConversationReadStatusUseCase = updateConversationReadStatusUseCase;
    }

    @Transactional
    public void execute(Long conversationId, Long actorId) {
        messageRepository.markAllAsRead(conversationId, actorId);
        updateConversationReadStatusUseCase.execute(conversationId, actorId);
    }
}