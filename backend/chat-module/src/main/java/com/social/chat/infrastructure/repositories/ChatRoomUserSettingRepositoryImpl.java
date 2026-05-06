package com.social.chat.infrastructure.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.chat.domain.entities.ChatRoomUserSetting;
import com.social.chat.domain.repositories.ChatRoomUserSettingRepository;

@Repository
public class ChatRoomUserSettingRepositoryImpl implements ChatRoomUserSettingRepository {

    private final JpaChatRoomUserSettingRepository jpaRepository;

    public ChatRoomUserSettingRepositoryImpl(JpaChatRoomUserSettingRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<ChatRoomUserSetting> findByConversationIdAndUserId(Long conversationId, Long userId) {
        return jpaRepository.findByConversationIdAndUserId(conversationId, userId);
    }

    @Override
    public List<ChatRoomUserSetting> findByConversationIdsAndUserId(Collection<Long> conversationIds, Long userId) {
        if (conversationIds == null || conversationIds.isEmpty()) {
            return List.of();
        }
        return jpaRepository.findByConversationIdInAndUserId(conversationIds, userId);
    }

    @Override
    public ChatRoomUserSetting save(ChatRoomUserSetting setting) {
        return jpaRepository.save(setting);
    }
}
