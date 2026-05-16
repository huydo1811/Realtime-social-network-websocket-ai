package com.social.friendship.application.usecases;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.application.services.FriendshipEventFactory;
import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.repositories.FriendshipRepository;

@Service
public class AcceptFriendRequestUseCase {
    private final FriendshipRepository friendshipRepository;
    private final FriendshipEventFactory eventFactory;
    private final ApplicationEventPublisher springEventPublisher;

    public AcceptFriendRequestUseCase(FriendshipRepository friendshipRepository,
                                      FriendshipEventFactory eventFactory,
                                      ApplicationEventPublisher springEventPublisher) {
        this.friendshipRepository = friendshipRepository;
        this.eventFactory = eventFactory;
        this.springEventPublisher = springEventPublisher;
    }

    @Transactional
    public Friendship execute(Long actorId, Long requestId) {
        Friendship friendship = friendshipRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lời mời kết bạn"));
        friendship.accept(actorId);
        Friendship saved = friendshipRepository.save(friendship);
        springEventPublisher.publishEvent(
                eventFactory.create("friendship.request.accepted", actorId, saved.getOtherUserId(actorId), saved));
        return saved;
    }
}
