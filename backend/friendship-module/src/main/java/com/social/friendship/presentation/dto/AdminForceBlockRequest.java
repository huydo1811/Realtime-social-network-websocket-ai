package com.social.friendship.presentation.dto;

import jakarta.validation.constraints.NotNull;

public class AdminForceBlockRequest {
    @NotNull(message = "blockerUserId là bắt buộc")
    private Long blockerUserId;

    public Long getBlockerUserId() {
        return blockerUserId;
    }

    public void setBlockerUserId(Long blockerUserId) {
        this.blockerUserId = blockerUserId;
    }
}
