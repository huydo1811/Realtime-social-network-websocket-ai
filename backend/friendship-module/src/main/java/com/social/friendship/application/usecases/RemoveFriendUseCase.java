package com.social.friendship.application.usecases;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.application.services.FriendshipEventFactory;
import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.repositories.FriendshipRepository;

@Service
public class RemoveFriendUseCase {
    private final FriendshipRepository friendshipRepository;
    private final FriendshipEventFactory eventFactory;
    private final ApplicationEventPublisher springEventPublisher;

    public RemoveFriendUseCase(FriendshipRepository friendshipRepository,
                               FriendshipEventFactory eventFactory,
                               ApplicationEventPublisher springEventPublisher) {
        this.friendshipRepository = friendshipRepository;
        this.eventFactory = eventFactory;
        this.springEventPublisher = springEventPublisher;
    }

    @Transactional
    public void execute(Long actorId, Long friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quan hệ bạn bè"));
        friendship.removeFriend(actorId);
        springEventPublisher.publishEvent(
                eventFactory.create("friendship.removed", actorId, friendship.getOtherUserId(actorId), friendship));
        friendshipRepository.delete(friendship);
    }
}
