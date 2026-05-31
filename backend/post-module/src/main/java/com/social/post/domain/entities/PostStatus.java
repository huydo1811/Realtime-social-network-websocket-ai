package com.social.post.domain.entities;

/**
 * Maps to {@code posts.moderation_status} (Flyway V1 schema).
 */
public enum PostStatus {
    PENDING,
    APPROVED,
    REJECTED,
    DELETED
}
