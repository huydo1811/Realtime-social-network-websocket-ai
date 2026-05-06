package com.social.chat.presentation.dto;

import jakarta.validation.constraints.Size;

public class UpdateConversationAppearanceRequest {

    @Size(max = 120)
    private String nickname;

    @Size(max = 20)
    private String bubbleTheme;

    @Size(max = 20)
    private String backgroundTheme;

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
