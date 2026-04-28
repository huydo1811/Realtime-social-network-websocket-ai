package com.social.chat.presentation.dto;

import jakarta.validation.constraints.NotNull;

public class AddConversationMemberRequest {

    @NotNull(message = "memberId là bắt buộc")
    private Long memberId;

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }
}
