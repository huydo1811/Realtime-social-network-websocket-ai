package com.social.post.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.post.domain.entities.PostComment;

public interface JpaPostCommentRepository extends JpaRepository<PostComment, Long> {
    List<PostComment> findByPostIdOrderByCreatedAtAsc(Long postId);

    long countByPostId(Long postId);

    @Query("""
            SELECT COUNT(c) FROM PostComment c
            WHERE c.postId = :postId AND c.hiddenByAdmin = false
            """)
    long countVisibleByPostId(@Param("postId") Long postId);
}
