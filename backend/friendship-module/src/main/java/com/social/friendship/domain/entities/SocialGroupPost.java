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
@Table(name = "social_group_posts")
public class SocialGroupPost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(name = "author_user_id", nullable = false)
    private Long authorUserId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "media_url", columnDefinition = "TEXT")
    private String mediaUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private GroupPostStatus status;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected SocialGroupPost() {
    }

    public static SocialGroupPost create(
            Long groupId,
            Long authorUserId,
            String content,
            String mediaUrl,
            boolean needApproval) {
        SocialGroupPost row = new SocialGroupPost();
        row.groupId = groupId;
        row.authorUserId = authorUserId;
        row.content = content;
        row.mediaUrl = mediaUrl;
        row.status = needApproval ? GroupPostStatus.PENDING : GroupPostStatus.APPROVED;
        return row;
    }

    public void approve(Long reviewerUserId) {
        status = GroupPostStatus.APPROVED;
        reviewedBy = reviewerUserId;
        reviewedAt = LocalDateTime.now();
    }

    public void reject(Long reviewerUserId) {
        status = GroupPostStatus.REJECTED;
        reviewedBy = reviewerUserId;
        reviewedAt = LocalDateTime.now();
    }

    public void updateContent(String content, String mediaUrl, boolean needReApproval) {
        this.content = content == null ? "" : content.trim();
        this.mediaUrl = mediaUrl == null || mediaUrl.isBlank() ? null : mediaUrl.trim();
        if (needReApproval) {
            this.status = GroupPostStatus.PENDING;
            this.reviewedBy = null;
            this.reviewedAt = null;
        }
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

    public Long getId() {
        return id;
    }

    public Long getGroupId() {
        return groupId;
    }

    public Long getAuthorUserId() {
        return authorUserId;
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
