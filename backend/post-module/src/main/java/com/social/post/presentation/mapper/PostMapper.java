package com.social.post.presentation.mapper;

import org.springframework.stereotype.Component;

import com.social.post.domain.entities.Post;
import com.social.post.presentation.dto.PostResponse;

@Component
public class PostMapper {
    public PostResponse toResponse(Post post) {
        PostResponse response = new PostResponse();
        response.setId(post.getId());
        response.setAuthorId(post.getAuthorId());
        response.setContent(post.getContent());
        response.setMediaUrl(post.getMediaUrl());
        response.setVisibility(post.getVisibility().name());
        response.setStatus(post.getStatus().name());
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());
        return response;
    }
}
