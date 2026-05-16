package com.social.friendship.application.usecases;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.application.services.FriendshipEventFactory;
import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.repositories.FriendshipRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class BlockUserUseCase {
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final FriendshipEventFactory eventFactory;
    private final ApplicationEventPublisher springEventPublisher;

    public BlockUserUseCase(FriendshipRepository friendshipRepository,
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
        if (actorId == null || targetUserId == null || actorId <= 0 || targetUserId <= 0) {
            throw new IllegalArgumentException("Người dùng không hợp lệ");
        }
        if (actorId.equals(targetUserId)) {
            throw new IllegalArgumentException("Không thể tự chặn chính mình");
        }
        if (userRepository.findById(targetUserId).isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy người dùng");
        }

        Friendship friendship = friendshipRepository.findByUsers(actorId, targetUserId)
                .orElseGet(() -> Friendship.createPending(actorId, targetUserId));

        friendship.block(actorId);
        Friendship saved = friendshipRepository.save(friendship);
        springEventPublisher.publishEvent(
                eventFactory.create("friendship.blocked", actorId, targetUserId, saved));
        return saved;
    }
}
