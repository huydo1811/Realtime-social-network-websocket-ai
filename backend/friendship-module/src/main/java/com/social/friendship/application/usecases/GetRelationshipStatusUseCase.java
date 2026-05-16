package com.social.friendship.application.usecases;

import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.repositories.FriendshipRepository;

@Service
public class GetRelationshipStatusUseCase {
    private final FriendshipRepository friendshipRepository;

    public GetRelationshipStatusUseCase(FriendshipRepository friendshipRepository) {
        this.friendshipRepository = friendshipRepository;
    }

    @Transactional(readOnly = true)
    public Optional<Friendship> execute(Long actorId, Long targetUserId) {
        return friendshipRepository.findByUsers(actorId, targetUserId);
    }
}
