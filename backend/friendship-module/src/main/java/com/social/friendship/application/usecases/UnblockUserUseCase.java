package com.social.friendship.application.usecases;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.application.services.FriendshipEventFactory;
import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.repositories.FriendshipRepository;

@Service
public class UnblockUserUseCase {
    private final FriendshipRepository friendshipRepository;
    private final FriendshipEventFactory eventFactory;
    private final ApplicationEventPublisher springEventPublisher;

    public UnblockUserUseCase(FriendshipRepository friendshipRepository,
                              FriendshipEventFactory eventFactory,
                              ApplicationEventPublisher springEventPublisher) {
        this.friendshipRepository = friendshipRepository;
        this.eventFactory = eventFactory;
        this.springEventPublisher = springEventPublisher;
    }

    @Transactional
    public void execute(Long actorId, Long targetUserId) {
        Friendship friendship = friendshipRepository.findByUsers(actorId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quan hệ chặn"));
        friendship.unblock(actorId);
        springEventPublisher.publishEvent(
                eventFactory.create("friendship.unblocked", actorId, targetUserId, friendship));
        friendshipRepository.delete(friendship);
    }
}
