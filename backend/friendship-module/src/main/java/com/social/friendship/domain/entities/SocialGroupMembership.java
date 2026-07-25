package com.social.friendship.domain.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "social_group_memberships",
        uniqueConstraints = @UniqueConstraint(name = "uk_social_group_membership_user", columnNames = { "group_id", "user_id" }))
public class SocialGroupMembership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private GroupMembershipRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private GroupMembershipStatus status;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "handled_at")
    private LocalDateTime handledAt;

    @Column(name = "handled_by")
    private Long handledBy;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    protected SocialGroupMembership() {
    }

    public static SocialGroupMembership owner(Long groupId, Long userId) {
        SocialGroupMembership row = new SocialGroupMembership();
        row.groupId = groupId;
        row.userId = userId;
        row.role = GroupMembershipRole.OWNER;
        row.status = GroupMembershipStatus.APPROVED;
        row.joinedAt = LocalDateTime.now();
        return row;
    }

    public static SocialGroupMembership joinRequest(Long groupId, Long userId, boolean autoApprove) {
        SocialGroupMembership row = new SocialGroupMembership();
        row.groupId = groupId;
        row.userId = userId;
        row.role = GroupMembershipRole.MEMBER;
        row.status = autoApprove ? GroupMembershipStatus.APPROVED : GroupMembershipStatus.PENDING;
        if (autoApprove) row.joinedAt = LocalDateTime.now();
        return row;
    }

    @PrePersist
    public void prePersist() {
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
    }

    public void approve(Long actorId) {
        status = GroupMembershipStatus.APPROVED;
        handledBy = actorId;
        handledAt = LocalDateTime.now();
        joinedAt = LocalDateTime.now();
    }

    public void reject(Long actorId) {
        status = GroupMembershipStatus.REJECTED;
        handledBy = actorId;
        handledAt = LocalDateTime.now();
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
