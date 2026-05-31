package com.social.post.domain.entities;

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
@Table(name = "posts")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long authorId;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "image_url", length = 1024)
    private String mediaUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false, length = 20)
    private PostVisibility visibility;

    @Enumerated(EnumType.STRING)
    @Column(name = "moderation_status", nullable = false, length = 20)
    private PostStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Post() {
    }

    public static Post create(Long authorId, String content, String mediaUrl, PostVisibility visibility) {
        Post post = new Post();
        post.authorId = authorId;
        post.content = normalizeContent(content);
        post.mediaUrl = normalizeMediaUrl(mediaUrl);
        post.visibility = visibility == null ? PostVisibility.PUBLIC : visibility;
        post.status = PostStatus.APPROVED;
        return post;
    }

    public void update(Long actorId, String content, String mediaUrl, PostVisibility visibility) {
        ensureOwner(actorId);
        if (status == PostStatus.DELETED) {
            throw new IllegalStateException("Không thể cập nhật bài viết đã xóa");
        }
        this.content = normalizeContent(content);
        this.mediaUrl = normalizeMediaUrl(mediaUrl);
        this.visibility = visibility == null ? this.visibility : visibility;
    }

    public void delete(Long actorId) {
        ensureOwner(actorId);
        this.status = PostStatus.DELETED;
    }

    public void hideByAdmin() {
        if (this.status != PostStatus.DELETED) {
            this.status = PostStatus.REJECTED;
        }
    }

    public boolean isVisibleToOwner(Long actorId) {
        return authorId.equals(actorId);
    }

    private void ensureOwner(Long actorId) {
        if (!authorId.equals(actorId)) {
            throw new IllegalStateException("Bạn không có quyền thao tác bài viết này");
        }
    }

    private static String normalizeContent(String input) {
        String value = input == null ? "" : input.trim();
        if (value.isBlank()) {
            throw new IllegalArgumentException("Nội dung bài viết không được để trống");
        }
        if (value.length() > 5000) {
            throw new IllegalArgumentException("Nội dung vượt quá 5000 ký tự");
        }
        return value;
    }

    private static String normalizeMediaUrl(String input) {
        String value = input == null ? null : input.trim();
        return (value == null || value.isBlank()) ? null : value;
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getAuthorId() {
        return authorId;
    }

    public String getContent() {
        return content;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public PostVisibility getVisibility() {
        return visibility;
    }

    public PostStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
