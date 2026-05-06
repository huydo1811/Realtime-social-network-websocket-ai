package com.social.chat.infrastructure.repositories;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.chat.domain.entities.ChatUserPresence;

public interface JpaChatUserPresenceRepository extends JpaRepository<ChatUserPresence, Long> {
    List<ChatUserPresence> findByUserIdIn(Collection<Long> userIds);
}
