package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.repositories.PostCommentLikeRepository;

@Service
public class GetPostCommentLikeStateUseCase {
    private final PostCommentLikeRepository postCommentLikeRepository;

    public GetPostCommentLikeStateUseCase(PostCommentLikeRepository postCommentLikeRepository) {
        this.postCommentLikeRepository = postCommentLikeRepository;
    }

    @Transactional(readOnly = true)
    public boolean execute(Long actorId, Long commentId) {
        return postCommentLikeRepository.existsByCommentIdAndUserId(commentId, actorId);
    }
}
