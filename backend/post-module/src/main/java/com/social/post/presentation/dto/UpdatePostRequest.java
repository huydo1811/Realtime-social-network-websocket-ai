package com.social.post.presentation.dto;

import com.social.post.domain.entities.PostVisibility;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;

public class UpdatePostRequest {
    @Size(max = 5000, message = "Nội dung vượt quá 5000 ký tự")
    private String content;

    @Size(max = 1024, message = "mediaUrl vượt quá 1024 ký tự")
    private String mediaUrl;

    private PostVisibility visibility;

    private Long petId;

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

    public Long getPetId() {
        return petId;
    }

    public void setPetId(Long petId) {
        this.petId = petId;
    }

    @AssertTrue(message = "Phải có nội dung hoặc ảnh/video")
    public boolean isContentOrMediaPresent() {
        boolean hasContent = content != null && !content.isBlank();
        boolean hasMedia = mediaUrl != null && !mediaUrl.isBlank();
        return hasContent || hasMedia;
    }
}
