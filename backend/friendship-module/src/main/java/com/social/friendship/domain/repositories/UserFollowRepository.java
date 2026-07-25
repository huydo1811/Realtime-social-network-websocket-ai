package com.social.friendship.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.friendship.domain.entities.UserFollow;

public interface UserFollowRepository {
    UserFollow save(UserFollow follow);

    Optional<UserFollow> findByFollowerAndFollowee(Long followerUserId, Long followeeUserId);

    List<UserFollow> findByFollowerUserId(Long followerUserId);

    List<UserFollow> findByFolloweeUserId(Long followeeUserId);

    List<Long> findFolloweeIdsByFollowerUserId(Long followerUserId);

    void delete(UserFollow follow);
}
