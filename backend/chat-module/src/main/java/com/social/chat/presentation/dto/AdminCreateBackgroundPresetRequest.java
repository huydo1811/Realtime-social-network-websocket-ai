package com.social.chat.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AdminCreateBackgroundPresetRequest {
    @NotBlank(message = "Tên background không được để trống")
    @Size(max = 120, message = "Tên background tối đa 120 ký tự")
    private String name;

    @NotBlank(message = "URL background không được để trống")
    private String imageUrl;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
