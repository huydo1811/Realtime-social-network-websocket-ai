package com.social.friendship.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.entities.FriendshipStatus;
import com.social.friendship.domain.repositories.FriendshipRepository;

@Service
public class ListFriendsUseCase {
    private final FriendshipRepository friendshipRepository;

    public ListFriendsUseCase(FriendshipRepository friendshipRepository) {
        this.friendshipRepository = friendshipRepository;
    }

    @Transactional(readOnly = true)
    public List<Friendship> execute(Long actorId) {
        return friendshipRepository.findByUserIdAndStatuses(actorId, List.of(FriendshipStatus.ACCEPTED));
    }
}
