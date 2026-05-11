package com.social.chat.domain.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import com.social.chat.domain.entities.ChatRoomUserSetting;

public interface ChatRoomUserSettingRepository {
    Optional<ChatRoomUserSetting> findByConversationIdAndUserId(Long conversationId, Long userId);

    List<ChatRoomUserSetting> findByConversationId(Long conversationId);

    List<ChatRoomUserSetting> findByConversationIdsAndUserId(Collection<Long> conversationIds, Long userId);

    ChatRoomUserSetting save(ChatRoomUserSetting setting);
}
