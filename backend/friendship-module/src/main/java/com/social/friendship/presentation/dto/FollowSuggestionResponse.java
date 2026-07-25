package com.social.friendship.presentation.dto;

import com.social.user.domain.entities.User;

public class FollowSuggestionResponse {
    private Long userId;
    private String fullName;
    private String username;
    private String avatarUrl;
    private String bio;

    public static FollowSuggestionResponse from(User user) {
        FollowSuggestionResponse dto = new FollowSuggestionResponse();
        dto.userId = user.getId();
        dto.fullName = user.getFullName();
        dto.username = user.getUsername();
        dto.avatarUrl = user.getAvatarUrl();
        dto.bio = user.getBio();
        return dto;
    }

    public Long getUserId() {
        return userId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getUsername() {
        return username;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getBio() {
        return bio;
    }
}
