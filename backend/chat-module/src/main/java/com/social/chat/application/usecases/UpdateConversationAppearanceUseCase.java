package com.social.chat.application.usecases;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.application.services.ChatPermissionService;
import com.social.chat.domain.entities.ChatConversation;
import com.social.chat.domain.events.ChatRealtimeEvent;
import com.social.chat.domain.exceptions.ConversationNotFoundException;
import com.social.chat.domain.repositories.ChatConversationRepository;

@Service
public class UpdateConversationAppearanceUseCase {

    private final ChatConversationRepository conversationRepository;
    private final ChatPermissionService permissionService;
    private final ApplicationEventPublisher springEventPublisher;

    public UpdateConversationAppearanceUseCase(ChatConversationRepository conversationRepository,
                                               ChatPermissionService permissionService,
                                               ApplicationEventPublisher springEventPublisher) {
        this.conversationRepository = conversationRepository;
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

        conversation.updateAppearance(nickname, bubbleTheme, backgroundTheme);
        ChatConversation saved = conversationRepository.save(conversation);

        ChatRealtimeEvent event = new ChatRealtimeEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventName("chat.conversation.appearance.updated");
        event.setConversationId(conversationId);
        event.setSenderId(actorId);
        event.setNickname(saved.getNickname());
        event.setBubbleTheme(saved.getBubbleTheme());
        event.setBackgroundTheme(saved.getBackgroundTheme());
        event.setNotice(buildNotice(saved));
        event.setOccurredAt(LocalDateTime.now());
        springEventPublisher.publishEvent(event);

        return saved;
    }

    private String buildNotice(ChatConversation conversation) {
        String nickname = conversation.getNickname() == null ? "mặc định" : "\"" + conversation.getNickname() + "\"";
        return "Đã cập nhật biệt danh " + nickname + ", màu bong bóng " + conversation.getBubbleTheme()
            + " và nền " + conversation.getBackgroundTheme() + ".";
    }
}
