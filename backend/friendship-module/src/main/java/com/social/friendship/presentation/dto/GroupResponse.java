package com.social.friendship.presentation.dto;

import java.time.LocalDateTime;

import com.social.friendship.domain.entities.GroupVisibility;
import com.social.friendship.domain.entities.SocialGroup;

public class GroupResponse {
    private Long id;
    private Long ownerUserId;
    private String name;
    private String description;
    private GroupVisibility visibility;
    private boolean requireApproval;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GroupResponse from(SocialGroup row) {
        GroupResponse dto = new GroupResponse();
        dto.id = row.getId();
        dto.ownerUserId = row.getOwnerUserId();
        dto.name = row.getName();
        dto.description = row.getDescription();
        dto.visibility = row.getVisibility();
        dto.requireApproval = row.isRequireApproval();
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

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public GroupVisibility getVisibility() {
        return visibility;
    }

    public boolean isRequireApproval() {
        return requireApproval;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
