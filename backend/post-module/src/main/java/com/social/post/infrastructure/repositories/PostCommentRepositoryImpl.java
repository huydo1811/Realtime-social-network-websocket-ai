package com.social.post.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.post.domain.entities.PostComment;
import com.social.post.domain.repositories.PostCommentRepository;

@Repository
public class PostCommentRepositoryImpl implements PostCommentRepository {
    private final JpaPostCommentRepository jpaPostCommentRepository;

    public PostCommentRepositoryImpl(JpaPostCommentRepository jpaPostCommentRepository) {
        this.jpaPostCommentRepository = jpaPostCommentRepository;
    }

    @Override
    public PostComment save(PostComment comment) {
        return jpaPostCommentRepository.save(comment);
    }

    @Override
    public List<PostComment> findByPostIdOrderByCreatedAtAsc(Long postId) {
        return jpaPostCommentRepository.findByPostIdOrderByCreatedAtAsc(postId);
    }

    @Override
    public long countByPostId(Long postId) {
        return jpaPostCommentRepository.countByPostId(postId);
    }

    @Override
    public Optional<PostComment> findById(Long id) {
        return jpaPostCommentRepository.findById(id);
    }
}
