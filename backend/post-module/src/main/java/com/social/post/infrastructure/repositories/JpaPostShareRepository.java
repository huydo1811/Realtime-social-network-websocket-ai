package com.social.post.infrastructure.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.post.domain.entities.PostShare;

public interface JpaPostShareRepository extends JpaRepository<PostShare, Long> {
    long countBySourcePostId(Long sourcePostId);
}
