package com.social.post.domain.repositories;

import java.util.Optional;

import com.social.post.domain.entities.PostCommentLike;

public interface PostCommentLikeRepository {
    Optional<PostCommentLike> findByCommentIdAndUserId(Long commentId, Long userId);

    boolean existsByCommentIdAndUserId(Long commentId, Long userId);

    PostCommentLike save(PostCommentLike like);

    void delete(PostCommentLike like);

    long countByCommentId(Long commentId);
}
