package com.social.post.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.post.domain.entities.PostLike;

public interface PostLikeRepository {
    Optional<PostLike> findByPostIdAndUserId(Long postId, Long userId);

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    PostLike save(PostLike postLike);

    void delete(PostLike postLike);

    long countByPostId(Long postId);

    List<PostLike> findByPostIdOrderByCreatedAtDesc(Long postId);
}
