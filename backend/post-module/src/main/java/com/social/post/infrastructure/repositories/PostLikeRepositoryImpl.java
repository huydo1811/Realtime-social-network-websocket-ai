package com.social.post.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.post.domain.entities.PostLike;
import com.social.post.domain.repositories.PostLikeRepository;

@Repository
public class PostLikeRepositoryImpl implements PostLikeRepository {
    private final JpaPostLikeRepository jpaPostLikeRepository;

    public PostLikeRepositoryImpl(JpaPostLikeRepository jpaPostLikeRepository) {
        this.jpaPostLikeRepository = jpaPostLikeRepository;
    }

    @Override
    public Optional<PostLike> findByPostIdAndUserId(Long postId, Long userId) {
        return jpaPostLikeRepository.findByPostIdAndUserId(postId, userId);
    }

    @Override
    public boolean existsByPostIdAndUserId(Long postId, Long userId) {
        return jpaPostLikeRepository.existsByPostIdAndUserId(postId, userId);
    }

    @Override
    public PostLike save(PostLike postLike) {
        return jpaPostLikeRepository.save(postLike);
    }

    @Override
    public void delete(PostLike postLike) {
        jpaPostLikeRepository.delete(postLike);
    }

    @Override
    public long countByPostId(Long postId) {
        return jpaPostLikeRepository.countByPostId(postId);
    }

    @Override
    public List<PostLike> findByPostIdOrderByCreatedAtDesc(Long postId) {
        return jpaPostLikeRepository.findByPostIdOrderByCreatedAtDesc(postId);
    }
}
