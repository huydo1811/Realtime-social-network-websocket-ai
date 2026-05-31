package com.social.post.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.post.domain.entities.PostComment;

public interface JpaPostCommentRepository extends JpaRepository<PostComment, Long> {
    List<PostComment> findByPostIdOrderByCreatedAtAsc(Long postId);

    long countByPostId(Long postId);
}
