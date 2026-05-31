package com.social.post.domain.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "post_shares")
public class PostShare {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_post_id", nullable = false)
    private Long sourcePostId;

    @Column(name = "shared_post_id", nullable = false)
    private Long sharedPostId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected PostShare() {
    }

    public static PostShare create(Long sourcePostId, Long sharedPostId, Long userId) {
        PostShare share = new PostShare();
        share.sourcePostId = sourcePostId;
        share.sharedPostId = sharedPostId;
        share.userId = userId;
        share.createdAt = LocalDateTime.now();
        return share;
    }

    public Long getId() {
        return id;
    }

    public Long getSourcePostId() {
        return sourcePostId;
    }

    public Long getSharedPostId() {
        return sharedPostId;
    }

    public Long getUserId() {
        return userId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
