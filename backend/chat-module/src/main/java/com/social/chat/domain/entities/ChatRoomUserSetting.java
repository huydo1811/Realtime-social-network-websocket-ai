package com.social.chat.domain.entities;

import java.io.Serializable;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "chat_room_user_settings")
@IdClass(ChatRoomUserSetting.ChatRoomUserSettingId.class)
public class ChatRoomUserSetting {

    @Id
    @Column(name = "room_id")
    private Long conversationId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "nickname")
    private String nickname;

    @Column(name = "bubble_theme", nullable = false)
    private String bubbleTheme = "ROSE";

    @Column(name = "background_theme", nullable = false)
    private String backgroundTheme = "PLAIN";

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static ChatRoomUserSetting create(Long conversationId, Long userId) {
        ChatRoomUserSetting setting = new ChatRoomUserSetting();
        setting.conversationId = conversationId;
        setting.userId = userId;
        return setting;
    }

    public void updateAppearance(String nextNickname, String nextBubbleTheme, String nextBackgroundTheme) {
        this.nickname = nextNickname == null || nextNickname.isBlank() ? null : nextNickname.trim();
        this.bubbleTheme = nextBubbleTheme == null || nextBubbleTheme.isBlank() ? "ROSE" : nextBubbleTheme.trim();
        this.backgroundTheme = nextBackgroundTheme == null || nextBackgroundTheme.isBlank() ? "PLAIN" : nextBackgroundTheme.trim();
    }

    @PrePersist
    public void prePersist() {
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getConversationId() {
        return conversationId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getNickname() {
        return nickname;
    }

    public String getBubbleTheme() {
        return bubbleTheme;
    }

    public String getBackgroundTheme() {
        return backgroundTheme;
    }

    public static class ChatRoomUserSettingId implements Serializable {
        private Long conversationId;
        private Long userId;

        public ChatRoomUserSettingId() {
        }
    }
}
