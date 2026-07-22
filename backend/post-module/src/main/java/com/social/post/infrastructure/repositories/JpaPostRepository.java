package com.social.post.infrastructure.repositories;

import java.util.Collection;
import java.time.LocalDateTime;

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

    @Query("""
            SELECT p FROM Post p
            WHERE p.petId = :petId
              AND p.status <> com.social.post.domain.entities.PostStatus.DELETED
            ORDER BY p.createdAt DESC
            """)
    Page<Post> findByPetId(@Param("petId") Long petId, Pageable pageable);

    @Query("""
            SELECT COUNT(p) FROM Post p
            WHERE p.petId = :petId
              AND (
                (:ownerView = true AND p.status <> com.social.post.domain.entities.PostStatus.DELETED)
                OR (:ownerView = false AND :friendView = true
                    AND p.status = com.social.post.domain.entities.PostStatus.APPROVED
                    AND p.visibility IN (
                      com.social.post.domain.entities.PostVisibility.PUBLIC,
                      com.social.post.domain.entities.PostVisibility.FRIENDS
                    ))
                OR (:ownerView = false AND :friendView = false
                    AND p.status = com.social.post.domain.entities.PostStatus.APPROVED
                    AND p.visibility = com.social.post.domain.entities.PostVisibility.PUBLIC)
              )
            """)
    long countVisibleByPetId(
            @Param("petId") Long petId,
            @Param("ownerView") boolean ownerView,
            @Param("friendView") boolean friendView);

    @Query("""
            SELECT COUNT(p) FROM Post p
            WHERE p.petId = :petId
              AND p.createdAt >= :since
              AND (
                (:ownerView = true AND p.status <> com.social.post.domain.entities.PostStatus.DELETED)
                OR (:ownerView = false AND :friendView = true
                    AND p.status = com.social.post.domain.entities.PostStatus.APPROVED
                    AND p.visibility IN (
                      com.social.post.domain.entities.PostVisibility.PUBLIC,
                      com.social.post.domain.entities.PostVisibility.FRIENDS
                    ))
                OR (:ownerView = false AND :friendView = false
                    AND p.status = com.social.post.domain.entities.PostStatus.APPROVED
                    AND p.visibility = com.social.post.domain.entities.PostVisibility.PUBLIC)
              )
            """)
    long countVisibleByPetIdSince(
            @Param("petId") Long petId,
            @Param("ownerView") boolean ownerView,
            @Param("friendView") boolean friendView,
            @Param("since") LocalDateTime since);

    @Query("""
            SELECT COUNT(p) FROM Post p
            WHERE p.petId = :petId
              AND p.mediaUrl IS NOT NULL
              AND p.mediaUrl <> ''
              AND (
                (:ownerView = true AND p.status <> com.social.post.domain.entities.PostStatus.DELETED)
                OR (:ownerView = false AND :friendView = true
                    AND p.status = com.social.post.domain.entities.PostStatus.APPROVED
                    AND p.visibility IN (
                      com.social.post.domain.entities.PostVisibility.PUBLIC,
                      com.social.post.domain.entities.PostVisibility.FRIENDS
                    ))
                OR (:ownerView = false AND :friendView = false
                    AND p.status = com.social.post.domain.entities.PostStatus.APPROVED
                    AND p.visibility = com.social.post.domain.entities.PostVisibility.PUBLIC)
              )
            """)
    long countVisibleMediaByPetId(
            @Param("petId") Long petId,
            @Param("ownerView") boolean ownerView,
            @Param("friendView") boolean friendView);

    @Query("""
            SELECT MAX(p.createdAt) FROM Post p
            WHERE p.petId = :petId
              AND (
                (:ownerView = true AND p.status <> com.social.post.domain.entities.PostStatus.DELETED)
                OR (:ownerView = false AND :friendView = true
                    AND p.status = com.social.post.domain.entities.PostStatus.APPROVED
                    AND p.visibility IN (
                      com.social.post.domain.entities.PostVisibility.PUBLIC,
                      com.social.post.domain.entities.PostVisibility.FRIENDS
                    ))
                OR (:ownerView = false AND :friendView = false
                    AND p.status = com.social.post.domain.entities.PostStatus.APPROVED
                    AND p.visibility = com.social.post.domain.entities.PostVisibility.PUBLIC)
              )
            """)
    LocalDateTime latestVisibleCreatedAtByPetId(
            @Param("petId") Long petId,
            @Param("ownerView") boolean ownerView,
            @Param("friendView") boolean friendView);
}
