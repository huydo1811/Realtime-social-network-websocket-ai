package com.social.post.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PostCommentRequest {
    @NotBlank(message = "Nội dung bình luận không được để trống")
    @Size(max = 2000, message = "Nội dung bình luận vượt quá 2000 ký tự")
    private String content;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
