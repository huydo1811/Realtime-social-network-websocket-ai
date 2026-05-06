package com.social.chat.domain.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import com.social.chat.domain.entities.ChatUserPresence;

public interface ChatUserPresenceRepository {
    Optional<ChatUserPresence> findByUserId(Long userId);

    ChatUserPresence save(ChatUserPresence presence);

    List<ChatUserPresence> findAllByUserIds(Collection<Long> userIds);
}
