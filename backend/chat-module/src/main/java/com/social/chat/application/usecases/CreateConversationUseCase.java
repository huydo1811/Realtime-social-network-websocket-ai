package com.social.chat.application.usecases;

import java.util.LinkedHashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.domain.entities.ChatConversation;
import com.social.chat.domain.entities.ConversationType;
import com.social.chat.domain.exceptions.InvalidConversationException;
import com.social.chat.domain.repositories.ChatConversationRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class CreateConversationUseCase {

    private static final Logger log = LoggerFactory.getLogger(CreateConversationUseCase.class);

    private final ChatConversationRepository conversationRepository;
    private final UserRepository userRepository;

    public CreateConversationUseCase(ChatConversationRepository conversationRepository,
            UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ChatConversation execute(Long actorId, ConversationType type, String name, Set<Long> participantIds, String idempotencyKey) {
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
            if (normalized.isEmpty()) {
                return conversationRepository.findSelfConversation(actorId)
                        .orElseGet(() -> conversationRepository.save(ChatConversation.selfConversation(actorId)));
            }
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

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var existing = conversationRepository.findByIdempotencyKey(actorId, idempotencyKey.trim());
            if (existing.isPresent()) {
                log.info("Conversation group already exists with idempotencyKey: {}", idempotencyKey);
                return existing.get();
            }
        }

        ChatConversation conversation = conversationRepository.save(ChatConversation.groupConversationWithIdempotency(actorId, name, normalized, idempotencyKey));
        log.info("Created new group conversation with id: {}", conversation.getId());
        return conversation;
    }

    private void ensureUserExists(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new InvalidConversationException("User không tồn tại: " + userId));
    }
}
