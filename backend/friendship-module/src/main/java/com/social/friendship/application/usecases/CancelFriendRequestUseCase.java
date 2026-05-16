package com.social.friendship.application.usecases;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.application.services.FriendshipEventFactory;
import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.repositories.FriendshipRepository;

@Service
public class CancelFriendRequestUseCase {
    private final FriendshipRepository friendshipRepository;
    private final FriendshipEventFactory eventFactory;
    private final ApplicationEventPublisher springEventPublisher;

    public CancelFriendRequestUseCase(FriendshipRepository friendshipRepository,
                                      FriendshipEventFactory eventFactory,
                                      ApplicationEventPublisher springEventPublisher) {
        this.friendshipRepository = friendshipRepository;
        this.eventFactory = eventFactory;
        this.springEventPublisher = springEventPublisher;
    }

    @Transactional
    public void execute(Long actorId, Long requestId) {
        Friendship friendship = friendshipRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lời mời kết bạn"));
        friendship.cancel(actorId);
        springEventPublisher.publishEvent(
                eventFactory.create("friendship.request.cancelled", actorId, friendship.getOtherUserId(actorId), friendship));
        friendshipRepository.delete(friendship);
    }
}
