package com.social.post.infrastructure.repositories;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.post.domain.entities.PostCommentLike;
import com.social.post.domain.repositories.PostCommentLikeRepository;

@Repository
public class PostCommentLikeRepositoryImpl implements PostCommentLikeRepository {
    private final JpaPostCommentLikeRepository jpaPostCommentLikeRepository;

    public PostCommentLikeRepositoryImpl(JpaPostCommentLikeRepository jpaPostCommentLikeRepository) {
        this.jpaPostCommentLikeRepository = jpaPostCommentLikeRepository;
    }

    @Override
    public Optional<PostCommentLike> findByCommentIdAndUserId(Long commentId, Long userId) {
        return jpaPostCommentLikeRepository.findByCommentIdAndUserId(commentId, userId);
    }

    @Override
    public boolean existsByCommentIdAndUserId(Long commentId, Long userId) {
        return jpaPostCommentLikeRepository.existsByCommentIdAndUserId(commentId, userId);
    }

    @Override
    public PostCommentLike save(PostCommentLike like) {
        return jpaPostCommentLikeRepository.save(like);
    }

    @Override
    public void delete(PostCommentLike like) {
        jpaPostCommentLikeRepository.delete(like);
    }

    @Override
    public long countByCommentId(Long commentId) {
        return jpaPostCommentLikeRepository.countByCommentId(commentId);
    }
}
