package com.social.friendship.presentation.dto;

import java.time.LocalDateTime;

import com.social.friendship.domain.entities.GroupMembershipRole;
import com.social.friendship.domain.entities.GroupMembershipStatus;
import com.social.friendship.domain.entities.SocialGroupMembership;

public class GroupMembershipResponse {
    private Long id;
    private Long groupId;
    private Long userId;
    private GroupMembershipRole role;
    private GroupMembershipStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime handledAt;
    private Long handledBy;
    private LocalDateTime joinedAt;

    public static GroupMembershipResponse from(SocialGroupMembership row) {
        GroupMembershipResponse dto = new GroupMembershipResponse();
        dto.id = row.getId();
        dto.groupId = row.getGroupId();
        dto.userId = row.getUserId();
        dto.role = row.getRole();
        dto.status = row.getStatus();
        dto.requestedAt = row.getRequestedAt();
        dto.handledAt = row.getHandledAt();
        dto.handledBy = row.getHandledBy();
        dto.joinedAt = row.getJoinedAt();
        return dto;
    }

    public Long getId() {
        return id;
    }

    public Long getGroupId() {
        return groupId;
    }

    public Long getUserId() {
        return userId;
    }

    public GroupMembershipRole getRole() {
        return role;
    }

    public GroupMembershipStatus getStatus() {
        return status;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public LocalDateTime getHandledAt() {
        return handledAt;
    }

    public Long getHandledBy() {
        return handledBy;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }
}
