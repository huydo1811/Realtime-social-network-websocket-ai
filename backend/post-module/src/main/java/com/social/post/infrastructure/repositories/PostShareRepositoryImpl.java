package com.social.post.infrastructure.repositories;

import org.springframework.stereotype.Repository;

import com.social.post.domain.entities.PostShare;
import com.social.post.domain.repositories.PostShareRepository;

@Repository
public class PostShareRepositoryImpl implements PostShareRepository {
    private final JpaPostShareRepository jpaPostShareRepository;

    public PostShareRepositoryImpl(JpaPostShareRepository jpaPostShareRepository) {
        this.jpaPostShareRepository = jpaPostShareRepository;
    }

    @Override
    public PostShare save(PostShare share) {
        return jpaPostShareRepository.save(share);
    }

    @Override
    public long countBySourcePostId(Long sourcePostId) {
        return jpaPostShareRepository.countBySourcePostId(sourcePostId);
    }
}
