package com.social.friendship.presentation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class FriendshipActionRequest {
    @NotNull(message = "targetUserId là bắt buộc")
    @Positive(message = "targetUserId phải lớn hơn 0")
    private Long targetUserId;

    public Long getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(Long targetUserId) {
        this.targetUserId = targetUserId;
    }
}
