package com.social.friendship.application.usecases;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.application.services.FriendshipEventFactory;
import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.entities.FriendshipStatus;
import com.social.friendship.domain.repositories.FriendshipRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class SendFriendRequestUseCase {
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final FriendshipEventFactory eventFactory;
    private final ApplicationEventPublisher springEventPublisher;

    public SendFriendRequestUseCase(
            FriendshipRepository friendshipRepository,
            UserRepository userRepository,
            FriendshipEventFactory eventFactory,
            ApplicationEventPublisher springEventPublisher) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.eventFactory = eventFactory;
        this.springEventPublisher = springEventPublisher;
    }

    @Transactional
    public Friendship execute(Long actorId, Long targetUserId) {
        validateUsers(actorId, targetUserId);

        Friendship friendship = friendshipRepository.findByUsers(actorId, targetUserId)
                .orElseGet(() -> Friendship.createPending(actorId, targetUserId));

        if (friendship.getId() != null) {
            FriendshipStatus current = friendship.getStatus();
            if (current == FriendshipStatus.PENDING) {
                throw new IllegalStateException("Lời mời kết bạn đang chờ xử lý");
            }
            if (current == FriendshipStatus.ACCEPTED) {
                throw new IllegalStateException("Hai người dùng đã là bạn bè");
            }
            if (current == FriendshipStatus.BLOCKED) {
                throw new IllegalStateException("Không thể gửi lời mời khi đang bị chặn");
            }
            friendship = Friendship.createPending(actorId, targetUserId);
        }

        Friendship saved = friendshipRepository.save(friendship);
        springEventPublisher.publishEvent(
                eventFactory.create("friendship.request.sent", actorId, targetUserId, saved));
        return saved;
    }

    private void validateUsers(Long actorId, Long targetUserId) {
        if (actorId == null || targetUserId == null || actorId <= 0 || targetUserId <= 0) {
            throw new IllegalArgumentException("Người dùng không hợp lệ");
        }
        if (actorId.equals(targetUserId)) {
            throw new IllegalArgumentException("Không thể tự gửi lời mời kết bạn");
        }
        if (userRepository.findById(actorId).isEmpty() || userRepository.findById(targetUserId).isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy người dùng");
        }
    }
}
