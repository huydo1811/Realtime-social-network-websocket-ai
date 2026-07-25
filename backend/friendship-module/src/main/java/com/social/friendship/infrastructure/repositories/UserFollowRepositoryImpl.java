package com.social.friendship.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.friendship.domain.entities.UserFollow;
import com.social.friendship.domain.repositories.UserFollowRepository;

@Repository
public class UserFollowRepositoryImpl implements UserFollowRepository {
    private final JpaUserFollowRepository jpaUserFollowRepository;

    public UserFollowRepositoryImpl(JpaUserFollowRepository jpaUserFollowRepository) {
        this.jpaUserFollowRepository = jpaUserFollowRepository;
    }

    @Override
    public UserFollow save(UserFollow follow) {
        return jpaUserFollowRepository.save(follow);
    }

    @Override
    public Optional<UserFollow> findByFollowerAndFollowee(Long followerUserId, Long followeeUserId) {
        return jpaUserFollowRepository.findByFollowerUserIdAndFolloweeUserId(followerUserId, followeeUserId);
    }

    @Override
    public List<UserFollow> findByFollowerUserId(Long followerUserId) {
        return jpaUserFollowRepository.findByFollowerUserIdOrderByCreatedAtDesc(followerUserId);
    }

    @Override
    public List<UserFollow> findByFolloweeUserId(Long followeeUserId) {
        return jpaUserFollowRepository.findByFolloweeUserIdOrderByCreatedAtDesc(followeeUserId);
    }

    @Override
    public List<Long> findFolloweeIdsByFollowerUserId(Long followerUserId) {
        return jpaUserFollowRepository.findFolloweeIdsByFollowerUserId(followerUserId);
    }

    @Override
    public void delete(UserFollow follow) {
        jpaUserFollowRepository.delete(follow);
    }
}
