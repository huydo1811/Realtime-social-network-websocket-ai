package com.social.chat.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SendMessageRequest {

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    @Size(max = 5000, message = "Nội dung tin nhắn tối đa 5000 ký tự")
    private String content;

    @Size(max = 100, message = "Idempotency key tối đa 100 ký tự")
    private String idempotencyKey;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }
}
