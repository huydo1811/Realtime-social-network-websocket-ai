package com.social.friendship.application.usecases;

import java.util.Optional;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
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

        Optional<Friendship> existing = friendshipRepository.findByUsers(actorId, targetUserId);
        if (existing.isPresent()) {
            return saveAndPublish(actorId, targetUserId, existing.get());
        }

        try {
            return saveAndPublish(actorId, targetUserId, Friendship.createPending(actorId, targetUserId));
        } catch (DataIntegrityViolationException ex) {
            Friendship row = friendshipRepository.findByUsers(actorId, targetUserId)
                    .orElseThrow(() -> new IllegalStateException(
                            "Đã tồn tại quan hệ kết bạn giữa hai người dùng. Vui lòng tải lại trang và thử lại.",
                            ex));
            return saveAndPublish(actorId, targetUserId, row);
        }
    }

    private Friendship saveAndPublish(Long actorId, Long targetUserId, Friendship friendship) {
        if (friendship.getId() != null) {
            applySendOnExisting(actorId, targetUserId, friendship);
        }
        Friendship saved = friendshipRepository.save(friendship);
        springEventPublisher.publishEvent(
                eventFactory.create("friendship.request.sent", actorId, targetUserId, saved));
        return saved;
    }

    private void applySendOnExisting(Long actorId, Long targetUserId, Friendship friendship) {
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
        if (current == FriendshipStatus.REJECTED) {
            friendship.reopenAsPending(actorId, targetUserId);
            return;
        }
        throw new IllegalStateException("Không thể gửi lời mời với trạng thái hiện tại");
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
