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
                                    String backgroundTheme) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));
        permissionService.ensureConversationMember(conversation, actorId);

        ChatRoomUserSetting setting = roomUserSettingRepository.findByConversationIdAndUserId(conversationId, actorId)
            .orElseGet(() -> ChatRoomUserSetting.create(conversationId, actorId));
        setting.updateAppearance(nickname, bubbleTheme, backgroundTheme);
        ChatRoomUserSetting saved = roomUserSettingRepository.save(setting);

        ChatRealtimeEvent event = new ChatRealtimeEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventName("chat.conversation.appearance.updated");
        event.setConversationId(conversationId);
        event.setSenderId(actorId);
        event.setTargetUserId(actorId);
        event.setNickname(saved.getNickname());
        event.setBubbleTheme(saved.getBubbleTheme());
        event.setBackgroundTheme(saved.getBackgroundTheme());
        event.setNotice(buildNotice(saved));
        event.setOccurredAt(LocalDateTime.now());
        springEventPublisher.publishEvent(event);
        return conversation;
    }

    private String buildNotice(ChatRoomUserSetting setting) {
        String nickname = setting.getNickname() == null ? "mặc định" : "\"" + setting.getNickname() + "\"";
        return "Bạn đã cập nhật biệt danh " + nickname + ", màu bong bóng " + setting.getBubbleTheme()
            + " và nền " + setting.getBackgroundTheme() + ".";
    }
}
