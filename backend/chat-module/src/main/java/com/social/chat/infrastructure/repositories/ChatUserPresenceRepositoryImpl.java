package com.social.chat.infrastructure.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.chat.domain.entities.ChatUserPresence;
import com.social.chat.domain.repositories.ChatUserPresenceRepository;

@Repository
public class ChatUserPresenceRepositoryImpl implements ChatUserPresenceRepository {

    private final JpaChatUserPresenceRepository jpaRepository;

    public ChatUserPresenceRepositoryImpl(JpaChatUserPresenceRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<ChatUserPresence> findByUserId(Long userId) {
        return jpaRepository.findById(userId);
    }

    @Override
    public ChatUserPresence save(ChatUserPresence presence) {
        return jpaRepository.save(presence);
    }

    @Override
    public List<ChatUserPresence> findAllByUserIds(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return jpaRepository.findByUserIdIn(userIds);
    }
}
