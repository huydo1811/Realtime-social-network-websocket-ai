package com.social.friendship.presentation.dto;

import java.time.LocalDateTime;

import com.social.friendship.domain.entities.GroupVisibility;
import com.social.friendship.domain.entities.SocialGroup;

public class AdminGroupDetailResponse {
    private Long id;
    private Long ownerUserId;
    private String ownerFullName;
    private String name;
    private String description;
    private String avatarUrl;
    private GroupVisibility visibility;
    private boolean requireApproval;
    private boolean requirePostApproval;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long memberCount;
    private long pendingMemberCount;
    private long postCount;
    private long pendingPostCount;

    public static AdminGroupDetailResponse from(
            SocialGroup row,
            String ownerFullName,
            long memberCount,
            long pendingMemberCount,
            long postCount,
            long pendingPostCount) {
        AdminGroupDetailResponse dto = new AdminGroupDetailResponse();
        dto.id = row.getId();
        dto.ownerUserId = row.getOwnerUserId();
        dto.ownerFullName = ownerFullName;
        dto.name = row.getName();
        dto.description = row.getDescription();
        dto.avatarUrl = row.getAvatarUrl();
        dto.visibility = row.getVisibility();
        dto.requireApproval = row.isRequireApproval();
        dto.requirePostApproval = row.isRequirePostApproval();
        dto.createdAt = row.getCreatedAt();
        dto.updatedAt = row.getUpdatedAt();
        dto.memberCount = memberCount;
        dto.pendingMemberCount = pendingMemberCount;
        dto.postCount = postCount;
        dto.pendingPostCount = pendingPostCount;
        return dto;
    }

    public Long getId() {
        return id;
    }

    public Long getOwnerUserId() {
        return ownerUserId;
    }

    public String getOwnerFullName() {
        return ownerFullName;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public GroupVisibility getVisibility() {
        return visibility;
    }

    public boolean isRequireApproval() {
        return requireApproval;
    }

    public boolean isRequirePostApproval() {
        return requirePostApproval;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public long getMemberCount() {
        return memberCount;
    }

    public long getPendingMemberCount() {
        return pendingMemberCount;
    }

    public long getPostCount() {
        return postCount;
    }

    public long getPendingPostCount() {
        return pendingPostCount;
    }
}
