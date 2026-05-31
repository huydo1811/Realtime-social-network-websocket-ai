package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.repositories.PostCommentRepository;
import com.social.post.domain.repositories.PostLikeRepository;
import com.social.post.domain.repositories.PostShareRepository;

@Service
public class GetPostStatsUseCase {
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;
    private final PostShareRepository postShareRepository;

    public GetPostStatsUseCase(
            PostLikeRepository postLikeRepository,
            PostCommentRepository postCommentRepository,
            PostShareRepository postShareRepository) {
        this.postLikeRepository = postLikeRepository;
        this.postCommentRepository = postCommentRepository;
        this.postShareRepository = postShareRepository;
    }

    @Transactional(readOnly = true)
    public PostStats execute(Long postId) {
        return new PostStats(
                postLikeRepository.countByPostId(postId),
                postCommentRepository.countByPostId(postId),
                postShareRepository.countBySourcePostId(postId));
    }

    public record PostStats(long likeCount, long commentCount, long shareCount) {}
}
