package com.social.chat.domain.entities;

import java.time.LocalDateTime;

import com.social.chat.domain.exceptions.ChatPermissionDeniedException;
import com.social.chat.domain.exceptions.InvalidMessageException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatConversation conversation;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "content", nullable = false)
    private String content;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "idempotency_key")
    private String idempotencyKey;

    @Version
    @Column(name = "version")
    private Long version;

    public ChatMessage() {
    }

    public static ChatMessage create(ChatConversation conversation, Long senderId, String content, String idempotencyKey) {
        if (conversation == null) {
            throw new InvalidMessageException("Conversation không hợp lệ");
        }
        if (senderId == null) {
            throw new InvalidMessageException("Sender không hợp lệ");
        }
        if (content == null || content.isBlank()) {
            throw new InvalidMessageException("Nội dung tin nhắn không được để trống");
        }

        ChatMessage m = new ChatMessage();
        m.conversation = conversation;
        m.senderId = senderId;
        m.content = content.trim();
        m.idempotencyKey = idempotencyKey == null || idempotencyKey.isBlank() ? null : idempotencyKey.trim();
        m.isRead = false;
        return m;
    }

    public void editBy(Long actorId, String newContent) {
        assertSender(actorId);
        if (isDeleted()) {
            throw new InvalidMessageException("Không thể sửa tin nhắn đã xóa");
        }
        if (newContent == null || newContent.isBlank()) {
            throw new InvalidMessageException("Nội dung tin nhắn không được để trống");
        }
        this.content = newContent.trim();
        this.editedAt = LocalDateTime.now();
    }

    public void deleteBy(Long actorId) {
        assertSender(actorId);
        if (isDeleted()) {
            return;
        }
        this.deletedAt = LocalDateTime.now();
        this.content = "[deleted]";
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    private void assertSender(Long actorId) {
        if (actorId == null || !actorId.equals(senderId)) {
            throw new ChatPermissionDeniedException("Bạn không có quyền thao tác message này");
        }
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

    public ChatConversation getConversation() {
        return conversation;
    }

    public Long getSenderId() {
        return senderId;
    }

    public String getContent() {
        return content;
    }

    public Boolean getRead() {
        return isRead;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getEditedAt() {
        return editedAt;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void markAsRead() {
        this.isRead = true;
    }

}
