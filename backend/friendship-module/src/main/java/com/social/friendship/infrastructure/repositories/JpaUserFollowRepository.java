package com.social.friendship.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.friendship.domain.entities.UserFollow;

public interface JpaUserFollowRepository extends JpaRepository<UserFollow, Long> {
    Optional<UserFollow> findByFollowerUserIdAndFolloweeUserId(Long followerUserId, Long followeeUserId);

    List<UserFollow> findByFollowerUserIdOrderByCreatedAtDesc(Long followerUserId);

    List<UserFollow> findByFolloweeUserIdOrderByCreatedAtDesc(Long followeeUserId);

    @Query("""
            SELECT f.followeeUserId FROM UserFollow f
            WHERE f.followerUserId = :followerUserId
            """)
    List<Long> findFolloweeIdsByFollowerUserId(@Param("followerUserId") Long followerUserId);
}
