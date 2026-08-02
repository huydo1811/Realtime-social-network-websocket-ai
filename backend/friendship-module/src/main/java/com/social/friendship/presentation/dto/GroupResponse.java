package com.social.friendship.presentation.dto;

import java.time.LocalDateTime;

import com.social.friendship.domain.entities.GroupVisibility;
import com.social.friendship.domain.entities.SocialGroup;

public class GroupResponse {
    private Long id;
    private Long ownerUserId;
    private String ownerFullName;
    private String name;
    private String description;
    private String avatarUrl;
    private GroupVisibility visibility;
    private boolean requireApproval;
    private boolean requirePostApproval;
    private long memberCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GroupResponse from(SocialGroup row) {
        return from(row, null, 0L);
    }

    public static GroupResponse from(SocialGroup row, String ownerFullName) {
        return from(row, ownerFullName, 0L);
    }

    public static GroupResponse from(SocialGroup row, String ownerFullName, long memberCount) {
        GroupResponse dto = new GroupResponse();
        dto.id = row.getId();
        dto.ownerUserId = row.getOwnerUserId();
        dto.ownerFullName = ownerFullName;
        dto.name = row.getName();
        dto.description = row.getDescription();
        dto.avatarUrl = row.getAvatarUrl();
        dto.visibility = row.getVisibility();
        dto.requireApproval = row.isRequireApproval();
        dto.requirePostApproval = row.isRequirePostApproval();
        dto.memberCount = memberCount;
        dto.createdAt = row.getCreatedAt();
        dto.updatedAt = row.getUpdatedAt();
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

    public long getMemberCount() {
        return memberCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
