package com.social.friendship.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.entities.FriendshipStatus;
import com.social.friendship.domain.repositories.FriendshipRepository;

@Repository
public class FriendshipRepositoryImpl implements FriendshipRepository {
    private final JpaFriendshipRepository jpaFriendshipRepository;

    public FriendshipRepositoryImpl(JpaFriendshipRepository jpaFriendshipRepository) {
        this.jpaFriendshipRepository = jpaFriendshipRepository;
    }

    @Override
    public Friendship save(Friendship friendship) {
        return jpaFriendshipRepository.save(friendship);
    }

    @Override
    public Optional<Friendship> findById(Long id) {
        return jpaFriendshipRepository.findById(id);
    }

    @Override
    public Optional<Friendship> findByUsers(Long userA, Long userB) {
        long lo = Math.min(userA, userB);
        long hi = Math.max(userA, userB);
        Optional<Friendship> normalized = jpaFriendshipRepository.findByUserId1AndUserId2(lo, hi);
        if (normalized.isPresent()) {
            return normalized;
        }
        Optional<Friendship> legacy = jpaFriendshipRepository.findByUserId1AndUserId2(hi, lo);
        if (legacy.isPresent()) {
            return legacy;
        }
        return jpaFriendshipRepository.findByUsersEitherOrder(userA, userB);
    }

    @Override
    public List<Friendship> findByUserIdAndStatuses(Long userId, List<FriendshipStatus> statuses) {
        return jpaFriendshipRepository.findByUserIdAndStatuses(userId, statuses);
    }

    @Override
    public List<Friendship> findPendingIncoming(Long userId) {
        return jpaFriendshipRepository.findPendingIncoming(userId);
    }

    @Override
    public List<Friendship> findPendingOutgoing(Long userId) {
        return jpaFriendshipRepository.findPendingOutgoing(userId);
    }

    @Override
    public List<Friendship> findBlockedByUser(Long userId) {
        return jpaFriendshipRepository.findBlockedByUser(userId);
    }

    @Override
    public void delete(Friendship friendship) {
        jpaFriendshipRepository.delete(friendship);
    }
}
