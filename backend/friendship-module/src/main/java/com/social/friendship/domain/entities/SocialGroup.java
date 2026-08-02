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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "social_groups")
public class SocialGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_user_id", nullable = false)
    private Long ownerUserId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private GroupVisibility visibility;

    @Column(name = "require_approval", nullable = false)
    private boolean requireApproval;

    @Column(name = "require_post_approval", nullable = false)
    private boolean requirePostApproval;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected SocialGroup() {
    }

    public static SocialGroup create(
            Long ownerUserId,
            String name,
            String description,
            GroupVisibility visibility,
            boolean requireApproval,
            boolean requirePostApproval,
            String avatarUrl) {
        SocialGroup group = new SocialGroup();
        group.ownerUserId = ownerUserId;
        group.name = name;
        group.description = description;
        group.visibility = visibility == null ? GroupVisibility.PUBLIC : visibility;
        group.requireApproval = requireApproval;
        group.requirePostApproval = requirePostApproval;
        group.avatarUrl = avatarUrl == null || avatarUrl.isBlank() ? null : avatarUrl.trim();
        return group;
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void updateProfile(String name, String description, String avatarUrl) {
        if (name != null) {
            String trimmed = name.trim();
            if (trimmed.isBlank()) {
                throw new IllegalArgumentException("Tên nhóm không được để trống");
            }
            if (trimmed.length() > 120) {
                throw new IllegalArgumentException("Tên nhóm tối đa 120 ký tự");
            }
            this.name = trimmed;
        }
        if (description != null) {
            String trimmed = description.trim();
            this.description = trimmed.isBlank() ? null : trimmed;
        }
        if (avatarUrl != null) {
            String trimmed = avatarUrl.trim();
            this.avatarUrl = trimmed.isBlank() ? null : trimmed;
        }
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

    public boolean isRequirePostApproval() {
        return requirePostApproval;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
