package com.social.friendship.infrastructure.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.friendship.domain.entities.SocialGroupPostLike;

public interface JpaSocialGroupPostLikeRepository extends JpaRepository<SocialGroupPostLike, Long> {
    Optional<SocialGroupPostLike> findByPostIdAndUserId(Long postId, Long userId);

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    long countByPostId(Long postId);

    void deleteByPostId(Long postId);
}
