package com.social.chat.infrastructure.repositories;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.social.chat.domain.entities.ChatUserBlock;
import com.social.chat.domain.repositories.ChatUserBlockRepository;

@Repository
public class ChatUserBlockRepositoryImpl implements ChatUserBlockRepository {
    private final JpaChatUserBlockRepository jpaRepository;

    public ChatUserBlockRepositoryImpl(JpaChatUserBlockRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public ChatUserBlock save(ChatUserBlock block) {
        return jpaRepository.save(block);
    }

    @Override
    public void delete(Long blockerId, Long blockedId) {
        jpaRepository.deleteByBlockerIdAndBlockedId(blockerId, blockedId);
    }

    @Override
    public boolean exists(Long blockerId, Long blockedId) {
        return jpaRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId);
    }

    @Override
    public List<ChatUserBlock> findByBlockerId(Long blockerId) {
        return jpaRepository.findByBlockerId(blockerId);
    }
}
