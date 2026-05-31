package com.social.post.infrastructure.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.post.domain.entities.PostCommentLike;

public interface JpaPostCommentLikeRepository extends JpaRepository<PostCommentLike, Long> {
    Optional<PostCommentLike> findByCommentIdAndUserId(Long commentId, Long userId);

    boolean existsByCommentIdAndUserId(Long commentId, Long userId);

    long countByCommentId(Long commentId);
}
