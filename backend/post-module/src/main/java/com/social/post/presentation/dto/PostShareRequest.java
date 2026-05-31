package com.social.post.presentation.dto;

import com.social.post.domain.entities.PostVisibility;

import jakarta.validation.constraints.Size;

public class PostShareRequest {
    @Size(max = 5000, message = "Nội dung vượt quá 5000 ký tự")
    private String content;

    private PostVisibility visibility;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public PostVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(PostVisibility visibility) {
        this.visibility = visibility;
    }
}
