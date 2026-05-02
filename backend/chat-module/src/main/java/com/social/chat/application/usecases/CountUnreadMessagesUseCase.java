package com.social.chat.application.usecases;

import java.util.Collection;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.domain.repositories.ChatMessageRepository;

@Service
public class CountUnreadMessagesUseCase {

    private final ChatMessageRepository messageRepository;

    public CountUnreadMessagesUseCase(ChatMessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @Transactional(readOnly = true)
    public Map<Long, Integer> execute(Collection<Long> conversationIds, Long actorId) {
        return messageRepository.countUnreadMessagesByConversationIds(conversationIds, actorId);
    }
}
