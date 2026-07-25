package com.social.friendship.presentation.dto;

import jakarta.validation.constraints.NotNull;

public class FollowRequest {
    @NotNull
    private Long targetUserId;

    public Long getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(Long targetUserId) {
        this.targetUserId = targetUserId;
    }
}
