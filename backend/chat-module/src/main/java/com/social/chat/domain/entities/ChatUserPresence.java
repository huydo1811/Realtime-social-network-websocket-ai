package com.social.chat.domain.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "chat_user_presence")
public class ChatUserPresence {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "is_online", nullable = false)
    private Boolean online = false;

    @Column(name = "last_seen_at", nullable = false)
    private LocalDateTime lastSeenAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static ChatUserPresence forUser(Long userId) {
        ChatUserPresence presence = new ChatUserPresence();
        presence.userId = userId;
        presence.online = false;
        LocalDateTime now = LocalDateTime.now();
        presence.lastSeenAt = now;
        presence.updatedAt = now;
        return presence;
    }

    public void heartbeat(boolean online) {
        this.online = online;
        this.lastSeenAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (lastSeenAt == null) {
            lastSeenAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getUserId() {
        return userId;
    }

    public Boolean getOnline() {
        return online;
    }

    public LocalDateTime getLastSeenAt() {
        return lastSeenAt;
    }
}
