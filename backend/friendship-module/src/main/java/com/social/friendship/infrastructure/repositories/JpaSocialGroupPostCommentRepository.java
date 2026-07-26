package com.social.friendship.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.friendship.domain.entities.SocialGroupPostComment;

public interface JpaSocialGroupPostCommentRepository extends JpaRepository<SocialGroupPostComment, Long> {
    List<SocialGroupPostComment> findByPostIdOrderByCreatedAtAsc(Long postId);

    long countByPostId(Long postId);

    void deleteByPostId(Long postId);
}
