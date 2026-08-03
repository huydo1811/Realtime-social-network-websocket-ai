package com.social.friendship.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.friendship.domain.entities.SocialGroupPostLike;

public interface JpaSocialGroupPostLikeRepository extends JpaRepository<SocialGroupPostLike, Long> {
    Optional<SocialGroupPostLike> findByPostIdAndUserId(Long postId, Long userId);

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    long countByPostId(Long postId);

    List<SocialGroupPostLike> findByPostIdOrderByCreatedAtDesc(Long postId);

    @Modifying
    @Query("DELETE FROM SocialGroupPostLike l WHERE l.postId = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}
