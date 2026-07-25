package com.social.friendship.presentation.dto;

import java.time.LocalDateTime;

import com.social.friendship.domain.entities.GroupPostStatus;
import com.social.friendship.domain.entities.SocialGroupPost;
import com.social.user.domain.entities.User;

public class GroupPostResponse {
    private Long id;
    private Long groupId;
    private String groupName;
    private Long authorUserId;
    private String authorName;
    private String authorAvatarUrl;
    private String content;
    private String mediaUrl;
    private GroupPostStatus status;
    private Long reviewedBy;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GroupPostResponse from(SocialGroupPost row, User author, String groupName) {
        GroupPostResponse dto = new GroupPostResponse();
        dto.id = row.getId();
        dto.groupId = row.getGroupId();
        dto.groupName = groupName;
        dto.authorUserId = row.getAuthorUserId();
        dto.authorName = author == null ? null : author.getFullName();
        dto.authorAvatarUrl = author == null ? null : author.getAvatarUrl();
        dto.content = row.getContent();
        dto.mediaUrl = row.getMediaUrl();
        dto.status = row.getStatus();
        dto.reviewedBy = row.getReviewedBy();
        dto.reviewedAt = row.getReviewedAt();
        dto.createdAt = row.getCreatedAt();
        dto.updatedAt = row.getUpdatedAt();
        return dto;
    }

    public static GroupPostResponse from(SocialGroupPost row, User author) {
        return from(row, author, null);
    }

    public Long getId() {
        return id;
    }

    public Long getGroupId() {
        return groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public Long getAuthorUserId() {
        return authorUserId;
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

    public String getMediaUrl() {
        return mediaUrl;
    }

    public GroupPostStatus getStatus() {
        return status;
    }

    public Long getReviewedBy() {
        return reviewedBy;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
