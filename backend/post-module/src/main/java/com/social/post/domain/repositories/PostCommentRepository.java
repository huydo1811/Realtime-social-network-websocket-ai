package com.social.post.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.post.domain.entities.PostComment;

public interface PostCommentRepository {
    PostComment save(PostComment comment);

    List<PostComment> findByPostIdOrderByCreatedAtAsc(Long postId);

    long countByPostId(Long postId);
    long countVisibleByPostId(Long postId);

    Optional<PostComment> findById(Long id);
}
