package com.social.chat.presentation.dto;

import java.time.LocalDateTime;
import java.util.Set;

import com.social.chat.domain.entities.ConversationType;

public class ConversationResponse {
    private Long id;
    private ConversationType type;
    private String name;
    private Set<Long> memberIds;
    private LocalDateTime createdAt;
    private int unreadCount;
    private String nickname;
    private String bubbleTheme;
    private String backgroundTheme;

    public int getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(int unreadCount) {
        this.unreadCount = unreadCount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ConversationType getType() {
        return type;
    }

    public void setType(ConversationType type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<Long> getMemberIds() {
        return memberIds;
    }

    public void setMemberIds(Set<Long> memberIds) {
        this.memberIds = memberIds;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getBubbleTheme() {
        return bubbleTheme;
    }

    public void setBubbleTheme(String bubbleTheme) {
        this.bubbleTheme = bubbleTheme;
    }

    public String getBackgroundTheme() {
        return backgroundTheme;
    }

    public void setBackgroundTheme(String backgroundTheme) {
        this.backgroundTheme = backgroundTheme;
    }
}
