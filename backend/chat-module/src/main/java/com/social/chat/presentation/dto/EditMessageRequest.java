package com.social.chat.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class EditMessageRequest {

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    @Size(max = 5000, message = "Nội dung tin nhắn tối đa 5000 ký tự")
    private String content;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
