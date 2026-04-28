package com.social.chat.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.domain.entities.ChatConversation;
import com.social.chat.domain.repositories.ChatConversationRepository;

@Service
public class ListMyConversationsUseCase {

    private final ChatConversationRepository conversationRepository;

    public ListMyConversationsUseCase(ChatConversationRepository conversationRepository) {
        this.conversationRepository = conversationRepository;
    }

    @Transactional(readOnly = true)
    public List<ChatConversation> execute(Long actorId) {
        return conversationRepository.findByMemberId(actorId);
    }
}
