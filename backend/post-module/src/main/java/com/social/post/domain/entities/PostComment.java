package com.social.post.domain.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "post_comments")
public class PostComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "parent_comment_id")
    private Long parentCommentId;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected PostComment() {
    }

    public static PostComment create(Long postId, Long userId, String content) {
        PostComment comment = new PostComment();
        comment.postId = postId;
        comment.userId = userId;
        comment.parentCommentId = null;
        comment.content = normalizeContent(content);
        return comment;
    }

    public static PostComment createReply(Long postId, Long userId, Long parentCommentId, String content) {
        PostComment comment = new PostComment();
        comment.postId = postId;
        comment.userId = userId;
        comment.parentCommentId = parentCommentId;
        comment.content = normalizeContent(content);
        return comment;
    }

    private static String normalizeContent(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Nội dung bình luận không được để trống");
        }
        if (normalized.length() > 2000) {
            throw new IllegalArgumentException("Nội dung bình luận vượt quá 2000 ký tự");
        }
        return normalized;
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

    public Long getPostId() {
        return postId;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getParentCommentId() {
        return parentCommentId;
    }

    public String getContent() {
        return content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
