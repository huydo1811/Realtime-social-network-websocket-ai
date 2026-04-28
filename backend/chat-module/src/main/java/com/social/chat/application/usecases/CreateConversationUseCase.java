package com.social.chat.application.usecases;

import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.domain.entities.ChatConversation;
import com.social.chat.domain.entities.ConversationType;
import com.social.chat.domain.exceptions.InvalidConversationException;
import com.social.chat.domain.repositories.ChatConversationRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class CreateConversationUseCase {

    private final ChatConversationRepository conversationRepository;
    private final UserRepository userRepository;

    public CreateConversationUseCase(ChatConversationRepository conversationRepository,
            UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ChatConversation execute(Long actorId, ConversationType type, String name, Set<Long> participantIds) {
        if (actorId == null) {
            throw new InvalidConversationException("Actor không hợp lệ");
        }
        ensureUserExists(actorId);

        if (type == null) {
            throw new InvalidConversationException("Type conversation là bắt buộc");
        }

        Set<Long> normalized = new LinkedHashSet<>();
        if (participantIds != null) {
            normalized.addAll(participantIds);
        }
        normalized.remove(actorId);

        if (type == ConversationType.PRIVATE) {
            if (normalized.size() != 1) {
                throw new InvalidConversationException("PRIVATE conversation yêu cầu đúng 1 participant");
            }
            Long targetId = normalized.iterator().next();
            ensureUserExists(targetId);

            return conversationRepository.findPrivateConversation(actorId, targetId)
                    .orElseGet(
                            () -> conversationRepository.save(ChatConversation.privateConversation(actorId, targetId)));
        }

        if (normalized.isEmpty()) {
            throw new InvalidConversationException("GROUP conversation cần ít nhất 1 participant khác");
        }

        for (Long participantId : normalized) {
            ensureUserExists(participantId);
        }

        return conversationRepository.save(ChatConversation.groupConversation(actorId, name, normalized));
    }

    private void ensureUserExists(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new InvalidConversationException("User không tồn tại: " + userId));
    }
}
