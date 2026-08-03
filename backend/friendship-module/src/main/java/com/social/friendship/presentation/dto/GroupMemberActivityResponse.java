package com.social.friendship.presentation.dto;

import java.time.LocalDateTime;
import java.util.List;

public record GroupMemberActivityResponse(
        Long userId,
        String fullName,
        long postCount,
        long commentCount,
        List<ActivityItem> recentPosts,
        List<ActivityItem> recentComments) {

    public record ActivityItem(
            Long id,
            Long postId,
            String contentPreview,
            LocalDateTime createdAt) {
    }
}
