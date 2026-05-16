package com.social.friendship.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.repositories.FriendshipRepository;

@Service
public class ListOutgoingRequestsUseCase {
    private final FriendshipRepository friendshipRepository;

    public ListOutgoingRequestsUseCase(FriendshipRepository friendshipRepository) {
        this.friendshipRepository = friendshipRepository;
    }

    @Transactional(readOnly = true)
    public List<Friendship> execute(Long actorId) {
        return friendshipRepository.findPendingOutgoing(actorId);
    }
}
