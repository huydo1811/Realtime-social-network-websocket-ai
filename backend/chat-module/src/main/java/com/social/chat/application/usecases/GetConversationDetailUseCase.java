package com.social.chat.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.application.services.ChatPermissionService;
import com.social.chat.domain.entities.ChatConversation;
import com.social.chat.domain.exceptions.ConversationNotFoundException;
import com.social.chat.domain.repositories.ChatConversationRepository;

@Service
public class GetConversationDetailUseCase {

    private final ChatConversationRepository conversationRepository;
    private final ChatPermissionService permissionService;

    public GetConversationDetailUseCase(ChatConversationRepository conversationRepository,
                                        ChatPermissionService permissionService) {
        this.conversationRepository = conversationRepository;
        this.permissionService = permissionService;
    }

    @Transactional(readOnly = true)
    public ChatConversation execute(Long actorId, Long conversationId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));

        permissionService.ensureConversationMember(conversation, actorId);
        return conversation;
    }
}
