package com.social.post.infrastructure.repositories;

import java.util.Collection;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.post.domain.entities.Post;
import com.social.post.domain.entities.PostStatus;
import com.social.post.domain.entities.PostVisibility;

public interface JpaPostRepository extends JpaRepository<Post, Long> {
    @Query("""
            SELECT p FROM Post p
            WHERE p.authorId = :authorId
              AND p.status <> com.social.post.domain.entities.PostStatus.DELETED
            ORDER BY p.createdAt DESC
            """)
    Page<Post> findByAuthorId(@Param("authorId") Long authorId, Pageable pageable);

    @Query("""
            SELECT p FROM Post p
            WHERE p.status = com.social.post.domain.entities.PostStatus.APPROVED
              AND (
                    p.visibility = com.social.post.domain.entities.PostVisibility.PUBLIC
                    OR p.authorId = :actorId
                    OR (p.visibility = com.social.post.domain.entities.PostVisibility.FRIENDS AND p.authorId IN :friendIds)
                  )
            ORDER BY p.createdAt DESC
            """)
    Page<Post> findFeed(@Param("actorId") Long actorId, @Param("friendIds") Collection<Long> friendIds, Pageable pageable);
}
