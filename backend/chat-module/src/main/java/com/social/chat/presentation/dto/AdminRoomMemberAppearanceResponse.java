package com.social.chat.presentation.dto;

public class AdminRoomMemberAppearanceResponse {
    private Long userId;
    private Boolean hasSavedSettings;
    private String nickname;
    private String bubbleTheme;
    private String backgroundTheme;
    private String backgroundImageUrl;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Boolean getHasSavedSettings() {
        return hasSavedSettings;
    }

    public void setHasSavedSettings(Boolean hasSavedSettings) {
        this.hasSavedSettings = hasSavedSettings;
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

    public String getBackgroundImageUrl() {
        return backgroundImageUrl;
    }

    public void setBackgroundImageUrl(String backgroundImageUrl) {
        this.backgroundImageUrl = backgroundImageUrl;
    }
}
