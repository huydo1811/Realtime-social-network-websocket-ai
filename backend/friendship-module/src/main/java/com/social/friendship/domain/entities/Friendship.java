package com.social.friendship.domain.entities;

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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "friendships",
        uniqueConstraints = @UniqueConstraint(name = "uk_friendships_pair", columnNames = {"user_id1", "user_id2"})
)
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id1", nullable = false)
    private Long userId1;

    @Column(name = "user_id2", nullable = false)
    private Long userId2;

    @Column(name = "requested_by", nullable = false)
    private Long requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private FriendshipStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Friendship() {
    }

    public static Friendship createPending(Long actorId, Long targetUserId) {
        Pair pair = normalizePair(actorId, targetUserId);
        Friendship friendship = new Friendship();
        friendship.userId1 = pair.left();
        friendship.userId2 = pair.right();
        friendship.requestedBy = actorId;
        friendship.status = FriendshipStatus.PENDING;
        return friendship;
    }

    public void accept(Long actorId) {
        ensureParticipant(actorId);
        if (status != FriendshipStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể chấp nhận khi trạng thái đang PENDING");
        }
        if (!actorId.equals(getReceiverId())) {
            throw new IllegalStateException("Chỉ người nhận lời mời mới có thể chấp nhận");
        }
        status = FriendshipStatus.ACCEPTED;
    }

    public void reject(Long actorId) {
        ensureParticipant(actorId);
        if (status != FriendshipStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể từ chối khi trạng thái đang PENDING");
        }
        if (!actorId.equals(getReceiverId())) {
            throw new IllegalStateException("Chỉ người nhận lời mời mới có thể từ chối");
        }
        status = FriendshipStatus.REJECTED;
    }

    public void cancel(Long actorId) {
        ensureParticipant(actorId);
        if (status != FriendshipStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể hủy khi trạng thái đang PENDING");
        }
        if (!actorId.equals(requestedBy)) {
            throw new IllegalStateException("Chỉ người gửi lời mời mới có thể hủy");
        }
    }

    public void removeFriend(Long actorId) {
        ensureParticipant(actorId);
        if (status != FriendshipStatus.ACCEPTED) {
            throw new IllegalStateException("Chỉ có thể hủy kết bạn khi trạng thái đang ACCEPTED");
        }
    }

    public void block(Long actorId) {
        ensureParticipant(actorId);
        status = FriendshipStatus.BLOCKED;
        requestedBy = actorId;
    }

    public void unblock(Long actorId) {
        if (status != FriendshipStatus.BLOCKED) {
            throw new IllegalStateException("Quan hệ hiện tại không ở trạng thái BLOCKED");
        }
        if (!requestedBy.equals(actorId)) {
            throw new IllegalStateException("Chỉ người đã chặn mới có thể bỏ chặn");
        }
    }

    public boolean containsUser(Long userId) {
        return userId1.equals(userId) || userId2.equals(userId);
    }

    public Long getOtherUserId(Long userId) {
        if (userId1.equals(userId)) {
            return userId2;
        }
        if (userId2.equals(userId)) {
            return userId1;
        }
        throw new IllegalArgumentException("Người dùng không thuộc quan hệ này");
    }

    public Long getReceiverId() {
        return requestedBy.equals(userId1) ? userId2 : userId1;
    }

    private void ensureParticipant(Long actorId) {
        if (!containsUser(actorId)) {
            throw new IllegalStateException("Người dùng không thuộc quan hệ này");
        }
    }

    private static Pair normalizePair(Long a, Long b) {
        if (a < b) {
            return new Pair(a, b);
        }
        return new Pair(b, a);
    }

    private record Pair(Long left, Long right) {}

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

    public Long getUserId1() {
        return userId1;
    }

    public Long getUserId2() {
        return userId2;
    }

    public Long getRequestedBy() {
        return requestedBy;
    }

    public FriendshipStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
