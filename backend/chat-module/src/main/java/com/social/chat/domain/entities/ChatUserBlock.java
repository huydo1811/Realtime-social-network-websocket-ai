package com.social.chat.domain.entities;

import java.io.Serializable;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "chat_user_blocks")
@IdClass(ChatUserBlock.ChatUserBlockId.class)
public class ChatUserBlock {
    @Id
    @Column(name = "blocker_id")
    private Long blockerId;

    @Id
    @Column(name = "blocked_id")
    private Long blockedId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static ChatUserBlock create(Long blockerId, Long blockedId) {
        ChatUserBlock block = new ChatUserBlock();
        block.blockerId = blockerId;
        block.blockedId = blockedId;
        return block;
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getBlockerId() {
        return blockerId;
    }

    public Long getBlockedId() {
        return blockedId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public static class ChatUserBlockId implements Serializable {
        private Long blockerId;
        private Long blockedId;

        public ChatUserBlockId() {
        }
    }
}
