package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.repositories.PostLikeRepository;

@Service
public class GetPostLikeStateUseCase {
    private final PostLikeRepository postLikeRepository;

    public GetPostLikeStateUseCase(PostLikeRepository postLikeRepository) {
        this.postLikeRepository = postLikeRepository;
    }

    @Transactional(readOnly = true)
    public boolean execute(Long actorId, Long postId) {
        return postLikeRepository.existsByPostIdAndUserId(postId, actorId);
    }
}
