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
@Table(name = "chat_conversation_read_status")
@IdClass(ChatConversationReadStatus.ChatConversationReadStatusId.class)
public class ChatConversationReadStatus {

    @Id
    @Column(name = "room_id")
    private Long conversationId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "last_read_message_id")
    private Long lastReadMessageId;

    @Column(name = "read_at", nullable = false)
    private LocalDateTime readAt;

    public static ChatConversationReadStatus create(Long conversationId, Long userId, Long lastReadMessageId) {
        ChatConversationReadStatus status = new ChatConversationReadStatus();
        status.conversationId = conversationId;
        status.userId = userId;
        status.lastReadMessageId = lastReadMessageId;
        status.readAt = LocalDateTime.now();
        return status;
    }

    public void advance(Long lastReadMessageId) {
        if (lastReadMessageId == null) {
            return;
        }
        if (this.lastReadMessageId == null || lastReadMessageId > this.lastReadMessageId) {
            this.lastReadMessageId = lastReadMessageId;
        }
        this.readAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (readAt == null) {
            readAt = LocalDateTime.now();
        }
    }

    public Long getConversationId() {
        return conversationId;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getLastReadMessageId() {
        return lastReadMessageId;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public static class ChatConversationReadStatusId implements Serializable {
        private Long conversationId;
        private Long userId;

        public ChatConversationReadStatusId() {
        }

        public ChatConversationReadStatusId(Long conversationId, Long userId) {
            this.conversationId = conversationId;
            this.userId = userId;
        }
    }
}
