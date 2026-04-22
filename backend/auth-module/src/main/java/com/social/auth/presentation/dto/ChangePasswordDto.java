package com.social.auth.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChangePasswordDto {
@NotBlank
private String currentPassword;

@NotBlank
@Size(min = 6)
private String newPassword;

@NotBlank
private String otpSessionToken;

public String getCurrentPassword() { 
    return currentPassword; 
}
public void setCurrentPassword(String currentPassword) { 
    this.currentPassword = currentPassword; 
}

public String getNewPassword() { 
    return newPassword; 
}
public void setNewPassword(String newPassword) { 
    this.newPassword = newPassword; 
}

public String getOtpSessionToken() { 
    return otpSessionToken; 
}
public void setOtpSessionToken(String otpSessionToken) { 
    this.otpSessionToken = otpSessionToken; }
}
