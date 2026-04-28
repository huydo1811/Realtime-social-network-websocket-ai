package com.social.chat.application.usecases;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.application.services.ChatPermissionService;
import com.social.chat.domain.entities.ChatConversation;
import com.social.chat.domain.entities.ChatMessage;
import com.social.chat.domain.exceptions.ConversationNotFoundException;
import com.social.chat.domain.repositories.ChatConversationRepository;
import com.social.chat.domain.repositories.ChatMessageRepository;

@Service
public class GetConversationMessagesUseCase {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatPermissionService permissionService;

    public GetConversationMessagesUseCase(ChatConversationRepository conversationRepository,
                                          ChatMessageRepository messageRepository,
                                          ChatPermissionService permissionService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.permissionService = permissionService;
    }

    @Transactional(readOnly = true)
    public Page<ChatMessage> execute(Long actorId, Long conversationId, Pageable pageable) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));

        permissionService.ensureConversationMember(conversation, actorId);

        return messageRepository.findByConversationId(conversationId, pageable);
    }
}
