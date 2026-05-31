package com.social.post.presentation.dto;

import com.social.post.domain.entities.PostVisibility;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreatePostRequest {
    @NotBlank(message = "Nội dung bài viết không được để trống")
    @Size(max = 5000, message = "Nội dung vượt quá 5000 ký tự")
    private String content;

    @Size(max = 1024, message = "mediaUrl vượt quá 1024 ký tự")
    private String mediaUrl;

    private PostVisibility visibility;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public void setMediaUrl(String mediaUrl) {
        this.mediaUrl = mediaUrl;
    }

    public PostVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(PostVisibility visibility) {
        this.visibility = visibility;
    }
}
