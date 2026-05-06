package com.social.chat.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;

import com.social.chat.domain.entities.ChatConversationReadStatus;
import com.social.chat.domain.repositories.ChatConversationReadStatusRepository;

@Service
public class GetConversationReadStatusesUseCase {

    private final ChatConversationReadStatusRepository readStatusRepository;

    public GetConversationReadStatusesUseCase(ChatConversationReadStatusRepository readStatusRepository) {
        this.readStatusRepository = readStatusRepository;
    }

    public List<ChatConversationReadStatus> execute(Long conversationId) {
        return readStatusRepository.findByConversationId(conversationId);
    }
}
