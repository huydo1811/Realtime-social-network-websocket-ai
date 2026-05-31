package com.social.post.presentation.mapper;

import org.springframework.stereotype.Component;

import com.social.post.application.usecases.GetPostStatsUseCase;
import com.social.post.domain.entities.Post;
import com.social.post.domain.repositories.PostRepository;
import com.social.post.presentation.dto.PostResponse;
import com.social.post.presentation.dto.SharedPostPreviewResponse;
import com.social.user.domain.repositories.UserRepository;

@Component
public class PostMapper {
    private final GetPostStatsUseCase getPostStatsUseCase;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostMapper(
            GetPostStatsUseCase getPostStatsUseCase,
            PostRepository postRepository,
            UserRepository userRepository) {
        this.getPostStatsUseCase = getPostStatsUseCase;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    public PostResponse toResponse(Post post) {
        var stats = getPostStatsUseCase.execute(post.getId());
        PostResponse response = new PostResponse();
        response.setId(post.getId());
        response.setAuthorId(post.getAuthorId());
        userRepository.findById(post.getAuthorId()).ifPresent(author -> {
            response.setAuthorName(author.getFullName());
            response.setAuthorAvatarUrl(author.getAvatarUrl());
        });
        response.setContent(post.getContent());
        response.setMediaUrl(post.getMediaUrl());
        response.setVisibility(post.getVisibility().name());
        response.setStatus(post.getStatus().name());
        response.setSharedPostId(post.getSharedPostId());
        response.setLikeCount(stats.likeCount());
        response.setCommentCount(stats.commentCount());
        response.setShareCount(stats.shareCount());
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());
        if (post.getSharedPostId() != null) {
            postRepository.findById(post.getSharedPostId()).ifPresent(shared -> {
                var sharedStats = getPostStatsUseCase.execute(shared.getId());
                SharedPostPreviewResponse preview = new SharedPostPreviewResponse();
                preview.setId(shared.getId());
                preview.setAuthorId(shared.getAuthorId());
                preview.setContent(shared.getContent());
                preview.setMediaUrl(shared.getMediaUrl());
                preview.setVisibility(shared.getVisibility().name());
                preview.setLikeCount(sharedStats.likeCount());
                preview.setCommentCount(sharedStats.commentCount());
                preview.setShareCount(sharedStats.shareCount());
                userRepository.findById(shared.getAuthorId()).ifPresent(author -> {
                    preview.setAuthorName(author.getFullName());
                    preview.setAuthorAvatarUrl(author.getAvatarUrl());
                });
                preview.setCreatedAt(shared.getCreatedAt());
                response.setSharedPost(preview);
            });
        }
        return response;
    }
}
