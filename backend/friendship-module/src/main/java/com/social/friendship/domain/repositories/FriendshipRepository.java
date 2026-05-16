package com.social.friendship.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.entities.FriendshipStatus;

public interface FriendshipRepository {
    Friendship save(Friendship friendship);

    Optional<Friendship> findById(Long id);

    Optional<Friendship> findByUsers(Long userA, Long userB);

    List<Friendship> findByUserIdAndStatuses(Long userId, List<FriendshipStatus> statuses);

    List<Friendship> findPendingIncoming(Long userId);

    List<Friendship> findPendingOutgoing(Long userId);

    List<Friendship> findBlockedByUser(Long userId);

    void delete(Friendship friendship);
}
