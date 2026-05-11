package com.social.chat.application.usecases;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.application.services.ChatPermissionService;
import com.social.chat.domain.entities.ChatConversation;
import com.social.chat.domain.entities.ChatRoomUserSetting;
import com.social.chat.domain.events.ChatRealtimeEvent;
import com.social.chat.domain.exceptions.ConversationNotFoundException;
import com.social.chat.domain.repositories.ChatConversationRepository;
import com.social.chat.domain.repositories.ChatRoomUserSettingRepository;

@Service
public class UpdateConversationAppearanceUseCase {

    private final ChatConversationRepository conversationRepository;
    private final ChatRoomUserSettingRepository roomUserSettingRepository;
    private final ChatPermissionService permissionService;
    private final ApplicationEventPublisher springEventPublisher;

    public UpdateConversationAppearanceUseCase(ChatConversationRepository conversationRepository,
                                               ChatRoomUserSettingRepository roomUserSettingRepository,
                                               ChatPermissionService permissionService,
                                               ApplicationEventPublisher springEventPublisher) {
        this.conversationRepository = conversationRepository;
        this.roomUserSettingRepository = roomUserSettingRepository;
        this.permissionService = permissionService;
        this.springEventPublisher = springEventPublisher;
    }

    @Transactional
    public ChatConversation execute(Long actorId,
                                    Long conversationId,
                                    String nickname,
                                    String bubbleTheme,
                                    String backgroundTheme,
                                    String backgroundImageUrl) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));
        permissionService.ensureConversationMember(conversation, actorId);

        ChatRoomUserSetting setting = roomUserSettingRepository.findByConversationIdAndUserId(conversationId, actorId)
            .orElseGet(() -> ChatRoomUserSetting.create(conversationId, actorId));
        setting.updateAppearance(nickname, bubbleTheme, backgroundTheme, backgroundImageUrl);
        ChatRoomUserSetting saved = roomUserSettingRepository.save(setting);

        // Sync shared background for all members so both sides see the same background.
        for (Long memberId : conversation.getMemberIds()) {
            if (memberId == null || memberId.equals(actorId)) {
                continue;
            }
            ChatRoomUserSetting memberSetting = roomUserSettingRepository
                    .findByConversationIdAndUserId(conversationId, memberId)
                    .orElseGet(() -> ChatRoomUserSetting.create(conversationId, memberId));
            memberSetting.updateAppearance(
                    memberSetting.getNickname(),
                    memberSetting.getBubbleTheme(),
                    saved.getBackgroundTheme(),
                    saved.getBackgroundImageUrl());
            ChatRoomUserSetting memberSaved = roomUserSettingRepository.save(memberSetting);
            publishAppearanceEvent(conversationId, actorId, memberSaved, buildNoticeForOthers(saved));
        }

        publishAppearanceEvent(conversationId, actorId, saved, buildNotice(saved));
        return conversation;
    }

    private void publishAppearanceEvent(Long conversationId, Long actorId, ChatRoomUserSetting setting, String notice) {
        ChatRealtimeEvent event = new ChatRealtimeEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventName("chat.conversation.appearance.updated");
        event.setConversationId(conversationId);
        event.setSenderId(actorId);
        event.setTargetUserId(setting.getUserId());
        event.setNickname(setting.getNickname());
        event.setBubbleTheme(setting.getBubbleTheme());
        event.setBackgroundTheme(setting.getBackgroundTheme());
        event.setBackgroundImageUrl(setting.getBackgroundImageUrl());
        event.setNotice(notice);
        event.setOccurredAt(LocalDateTime.now());
        springEventPublisher.publishEvent(event);
    }

    private String buildNotice(ChatRoomUserSetting setting) {
        String nickname = setting.getNickname() == null ? "mặc định" : "\"" + setting.getNickname() + "\"";
        return "Bạn đã cập nhật biệt danh " + nickname + ", màu bong bóng " + setting.getBubbleTheme()
            + ", nền " + setting.getBackgroundTheme()
            + (setting.getBackgroundImageUrl() == null ? "." : " và background ảnh.");
    }

    private String buildNoticeForOthers(ChatRoomUserSetting actorSetting) {
        return "Nền cuộc trò chuyện đã được đồng bộ: " + actorSetting.getBackgroundTheme()
                + (actorSetting.getBackgroundImageUrl() == null ? "." : " và background ảnh.");
    }
}
