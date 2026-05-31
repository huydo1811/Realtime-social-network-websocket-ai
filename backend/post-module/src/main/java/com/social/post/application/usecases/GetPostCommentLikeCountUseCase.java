package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.repositories.PostCommentLikeRepository;

@Service
public class GetPostCommentLikeCountUseCase {
    private final PostCommentLikeRepository postCommentLikeRepository;

    public GetPostCommentLikeCountUseCase(PostCommentLikeRepository postCommentLikeRepository) {
        this.postCommentLikeRepository = postCommentLikeRepository;
    }

    @Transactional(readOnly = true)
    public long execute(Long commentId) {
        return postCommentLikeRepository.countByCommentId(commentId);
    }
}
