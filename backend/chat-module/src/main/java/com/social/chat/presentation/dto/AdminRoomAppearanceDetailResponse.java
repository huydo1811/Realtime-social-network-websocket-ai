package com.social.chat.presentation.dto;

import java.util.List;

public class AdminRoomAppearanceDetailResponse {
    private Long conversationId;
    private String roomNickname;
    private String roomBubbleTheme;
    private String roomBackgroundTheme;
    private List<AdminRoomMemberAppearanceResponse> members;

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public String getRoomNickname() {
        return roomNickname;
    }

    public void setRoomNickname(String roomNickname) {
        this.roomNickname = roomNickname;
    }

    public String getRoomBubbleTheme() {
        return roomBubbleTheme;
    }

    public void setRoomBubbleTheme(String roomBubbleTheme) {
        this.roomBubbleTheme = roomBubbleTheme;
    }

    public String getRoomBackgroundTheme() {
        return roomBackgroundTheme;
    }

    public void setRoomBackgroundTheme(String roomBackgroundTheme) {
        this.roomBackgroundTheme = roomBackgroundTheme;
    }

    public List<AdminRoomMemberAppearanceResponse> getMembers() {
        return members;
    }

    public void setMembers(List<AdminRoomMemberAppearanceResponse> members) {
        this.members = members;
    }
}
