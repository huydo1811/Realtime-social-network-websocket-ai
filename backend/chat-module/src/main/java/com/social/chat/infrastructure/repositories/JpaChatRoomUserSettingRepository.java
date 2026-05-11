package com.social.chat.infrastructure.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.chat.domain.entities.ChatRoomUserSetting;
import com.social.chat.domain.entities.ChatRoomUserSetting.ChatRoomUserSettingId;

public interface JpaChatRoomUserSettingRepository extends JpaRepository<ChatRoomUserSetting, ChatRoomUserSettingId> {
    Optional<ChatRoomUserSetting> findByConversationIdAndUserId(Long conversationId, Long userId);

    List<ChatRoomUserSetting> findByConversationIdOrderByUserIdAsc(Long conversationId);

    List<ChatRoomUserSetting> findByConversationIdInAndUserId(Collection<Long> conversationIds, Long userId);
}
