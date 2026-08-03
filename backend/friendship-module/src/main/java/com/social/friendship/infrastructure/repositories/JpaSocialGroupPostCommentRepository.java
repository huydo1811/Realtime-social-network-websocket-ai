package com.social.friendship.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.friendship.domain.entities.SocialGroupPostComment;

public interface JpaSocialGroupPostCommentRepository extends JpaRepository<SocialGroupPostComment, Long> {
    List<SocialGroupPostComment> findByPostIdOrderByCreatedAtAsc(Long postId);

    List<SocialGroupPostComment> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByPostId(Long postId);

    @Modifying
    @Query("DELETE FROM SocialGroupPostComment c WHERE c.postId = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}
