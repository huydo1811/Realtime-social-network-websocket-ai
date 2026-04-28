package com.social.chat.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.application.services.ChatPermissionService;
import com.social.chat.domain.entities.ChatConversation;
import com.social.chat.domain.entities.ConversationType;
import com.social.chat.domain.exceptions.ConversationNotFoundException;
import com.social.chat.domain.exceptions.InvalidConversationException;
import com.social.chat.domain.repositories.ChatConversationRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class AddConversationMemberUseCase {

    private final ChatConversationRepository conversationRepository;
    private final ChatPermissionService permissionService;
    private final UserRepository userRepository;

    public AddConversationMemberUseCase(ChatConversationRepository conversationRepository,
            ChatPermissionService permissionService,
            UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.permissionService = permissionService;
        this.userRepository = userRepository;
    }

    @Transactional
    public ChatConversation execute(Long actorId, Long conversationId, Long memberId) {
        if (memberId == null) {
            throw new InvalidConversationException("memberId là bắt buộc");
        }

        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ConversationNotFoundException(conversationId));

        permissionService.ensureConversationMember(conversation, actorId);

        if (conversation.getType() == ConversationType.PRIVATE) {
            throw new InvalidConversationException("Không thể thêm thành viên vào PRIVATE conversation");
        }

        userRepository.findById(memberId)
                .orElseThrow(() -> new InvalidConversationException("User không tồn tại: " + memberId));

        conversation.addMember(memberId);
        return conversationRepository.save(conversation);
    }
}
