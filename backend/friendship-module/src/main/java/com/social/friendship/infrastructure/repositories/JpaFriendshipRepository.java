package com.social.friendship.infrastructure.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.entities.FriendshipStatus;

public interface JpaFriendshipRepository extends JpaRepository<Friendship, Long> {

    Optional<Friendship> findByUserId1AndUserId2(Long userId1, Long userId2);

    @Query("""
            SELECT f FROM Friendship f
            WHERE (f.userId1 = :userA AND f.userId2 = :userB)
               OR (f.userId1 = :userB AND f.userId2 = :userA)
            """)
    Optional<Friendship> findByUsersEitherOrder(@Param("userA") Long userA, @Param("userB") Long userB);

    @Query("""
            SELECT f FROM Friendship f
            WHERE (f.userId1 = :userId OR f.userId2 = :userId)
              AND f.status IN :statuses
            ORDER BY f.updatedAt DESC
            """)
    List<Friendship> findByUserIdAndStatuses(@Param("userId") Long userId,
                                             @Param("statuses") Collection<FriendshipStatus> statuses);

    @Query("""
            SELECT f FROM Friendship f
            WHERE (f.userId1 = :userId OR f.userId2 = :userId)
            ORDER BY f.updatedAt DESC
            """)
    List<Friendship> findByUserId(@Param("userId") Long userId);

    @Query("""
            SELECT f FROM Friendship f
            WHERE f.status = com.social.friendship.domain.entities.FriendshipStatus.PENDING
              AND ((f.userId1 = :userId OR f.userId2 = :userId) AND f.requestedBy <> :userId)
            ORDER BY f.createdAt DESC
            """)
    List<Friendship> findPendingIncoming(@Param("userId") Long userId);

    @Query("""
            SELECT f FROM Friendship f
            WHERE f.status = com.social.friendship.domain.entities.FriendshipStatus.PENDING
              AND f.requestedBy = :userId
            ORDER BY f.createdAt DESC
            """)
    List<Friendship> findPendingOutgoing(@Param("userId") Long userId);

    @Query("""
            SELECT f FROM Friendship f
            WHERE f.status = com.social.friendship.domain.entities.FriendshipStatus.BLOCKED
              AND f.requestedBy = :userId
            ORDER BY f.updatedAt DESC
            """)
    List<Friendship> findBlockedByUser(@Param("userId") Long userId);
}
