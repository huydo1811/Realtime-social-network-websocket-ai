package com.social.post.presentation.dto;

import com.social.post.domain.entities.PostVisibility;

import jakarta.validation.constraints.NotNull;

public class UpdatePostVisibilityRequest {
    @NotNull(message = "visibility là bắt buộc")
    private PostVisibility visibility;

    public PostVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(PostVisibility visibility) {
        this.visibility = visibility;
    }
}
