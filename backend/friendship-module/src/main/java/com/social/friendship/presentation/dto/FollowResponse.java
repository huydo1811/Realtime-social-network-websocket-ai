package com.social.friendship.presentation.dto;

import java.time.LocalDateTime;

import com.social.friendship.domain.entities.UserFollow;

public class FollowResponse {
    private Long id;
    private Long followerUserId;
    private Long followeeUserId;
    private LocalDateTime createdAt;

    public static FollowResponse from(UserFollow row) {
        FollowResponse dto = new FollowResponse();
        dto.id = row.getId();
        dto.followerUserId = row.getFollowerUserId();
        dto.followeeUserId = row.getFolloweeUserId();
        dto.createdAt = row.getCreatedAt();
        return dto;
    }

    public Long getId() {
        return id;
    }

    public Long getFollowerUserId() {
        return followerUserId;
    }

    public Long getFolloweeUserId() {
        return followeeUserId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
