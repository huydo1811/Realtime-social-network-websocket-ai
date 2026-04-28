package com.social.chat.domain.entities;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

import com.social.chat.domain.exceptions.InvalidConversationException;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "chat_rooms")
public class ChatConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private ConversationType type;

    @Column(name = "name")
    private String name;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "chat_room_members", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "user_id", nullable = false)
    private Set<Long> memberIds = new HashSet<>();

    public ChatConversation() {
    }

    public static ChatConversation privateConversation(Long creatorId, Long targetUserId) {
        if (creatorId == null || targetUserId == null) {
            throw new InvalidConversationException("PRIVATE conversation yêu cầu 2 user hợp lệ");
        }
        if (Objects.equals(creatorId, targetUserId)) {
            throw new InvalidConversationException("Không thể tạo PRIVATE conversation với chính mình");
        }

        ChatConversation c = new ChatConversation();
        c.type = ConversationType.PRIVATE;
        c.memberIds.add(creatorId);
        c.memberIds.add(targetUserId);
        return c;
    }

    public static ChatConversation groupConversation(Long creatorId, String name, Set<Long> participantIds) {
        if (creatorId == null) {
            throw new InvalidConversationException("Creator không hợp lệ");
        }
        if (name == null || name.isBlank()) {
            throw new InvalidConversationException("Tên nhóm không được để trống");
        }

        ChatConversation c = new ChatConversation();
        c.type = ConversationType.GROUP;
        c.name = name.trim();
        c.memberIds.add(creatorId);
        if (participantIds != null) {
            c.memberIds.addAll(participantIds);
        }
        return c;
    }

    public boolean hasMember(Long userId) {
        return userId != null && memberIds.contains(userId);
    }

    public void addMember(Long userId) {
        if (userId == null) {
            throw new InvalidConversationException("UserId không hợp lệ");
        }
        memberIds.add(userId);
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

    public ConversationType getType() {
        return type;
    }

    public String getName() {
        return name;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Set<Long> getMemberIds() {
        return Collections.unmodifiableSet(memberIds);
    }
}
