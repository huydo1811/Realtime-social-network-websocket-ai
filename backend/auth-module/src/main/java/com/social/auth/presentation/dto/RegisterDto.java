package com.social.auth.presentation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterDto {
    @NotBlank @Email
    private String email;

    @NotBlank @Size(min = 6, max = 20)
    private String phone;

    @NotBlank @Size(min = 6)
    private String password;

    @NotBlank
    private String fullName;

    @NotBlank
    private String otpSessionToken;

    private String bio;
    private String avatarUrl;
    private String coverUrl;
    private String role;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getCoverUrl() { return coverUrl; }
    public void setCoverUrl(String coverUrl) { this.coverUrl = coverUrl; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getOtpSessionToken() { return otpSessionToken; }
    public void setOtpSessionToken(String otpSessionToken) { this.otpSessionToken = otpSessionToken; }
}