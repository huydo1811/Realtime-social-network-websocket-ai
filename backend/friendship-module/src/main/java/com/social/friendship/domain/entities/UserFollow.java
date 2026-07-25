package com.social.friendship.domain.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "user_follows",
        uniqueConstraints = @UniqueConstraint(name = "uk_user_follows_pair", columnNames = { "follower_user_id", "followee_user_id" }))
public class UserFollow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "follower_user_id", nullable = false)
    private Long followerUserId;

    @Column(name = "followee_user_id", nullable = false)
    private Long followeeUserId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected UserFollow() {
    }

    public static UserFollow of(Long followerUserId, Long followeeUserId) {
        if (followerUserId == null || followeeUserId == null) {
            throw new IllegalArgumentException("Thiếu thông tin follow");
        }
        if (followerUserId.equals(followeeUserId)) {
            throw new IllegalArgumentException("Không thể tự theo dõi chính mình");
        }
        UserFollow row = new UserFollow();
        row.followerUserId = followerUserId;
        row.followeeUserId = followeeUserId;
        return row;
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Long getFollowerUserId() {
        return followerUserId;
    }

    public Long getFolloweeUserId() {
        return followeeUserId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
