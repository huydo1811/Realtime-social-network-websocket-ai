package com.social.friendship.presentation.dto;

import java.time.LocalDateTime;

import com.social.friendship.domain.entities.SocialGroupPostComment;
import com.social.user.domain.entities.User;

public class GroupPostCommentResponse {
    private Long id;
    private Long postId;
    private Long userId;
    private String authorName;
    private String authorAvatarUrl;
    private String content;
    private LocalDateTime createdAt;

    public static GroupPostCommentResponse from(SocialGroupPostComment row, User author) {
        GroupPostCommentResponse dto = new GroupPostCommentResponse();
        dto.id = row.getId();
        dto.postId = row.getPostId();
        dto.userId = row.getUserId();
        dto.authorName = author == null ? null : author.getFullName();
        dto.authorAvatarUrl = author == null ? null : author.getAvatarUrl();
        dto.content = row.getContent();
        dto.createdAt = row.getCreatedAt();
        return dto;
    }

    public Long getId() {
        return id;
    }

    public Long getPostId() {
        return postId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getAuthorName() {
        return authorName;
    }

    public String getAuthorAvatarUrl() {
        return authorAvatarUrl;
    }

    public String getContent() {
        return content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
