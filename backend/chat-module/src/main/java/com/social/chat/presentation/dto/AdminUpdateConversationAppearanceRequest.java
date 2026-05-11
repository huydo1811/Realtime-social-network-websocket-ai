package com.social.chat.presentation.dto;

import jakarta.validation.constraints.Pattern;

public class AdminUpdateConversationAppearanceRequest {
    private String nickname;

    @Pattern(regexp = "^(ROSE|OCEAN|FOREST|SUNSET)$", message = "bubbleTheme không hợp lệ")
    private String bubbleTheme;

    @Pattern(regexp = "^(PLAIN|MESH|DOTS)$", message = "backgroundTheme không hợp lệ")
    private String backgroundTheme;

    private String backgroundImageUrl;

    private Long targetUserId;

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

    public Long getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(Long targetUserId) {
        this.targetUserId = targetUserId;
    }

    public String getBackgroundImageUrl() {
        return backgroundImageUrl;
    }

    public void setBackgroundImageUrl(String backgroundImageUrl) {
        this.backgroundImageUrl = backgroundImageUrl;
    }
}
