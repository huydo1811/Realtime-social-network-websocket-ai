package com.social.chat.domain.repositories;

import java.util.List;

import com.social.chat.domain.entities.ChatUserBlock;

public interface ChatUserBlockRepository {
    ChatUserBlock save(ChatUserBlock block);

    void delete(Long blockerId, Long blockedId);

    boolean exists(Long blockerId, Long blockedId);

    List<ChatUserBlock> findByBlockerId(Long blockerId);
}
