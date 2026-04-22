package com.social.auth.presentation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ResetPasswordByOtpDto {
  @NotBlank
  @Email
  private String email;

  @NotBlank
  @Size(min = 6)
  private String newPassword;

  @NotBlank
  private String otpSessionToken;

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
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
    this.otpSessionToken = otpSessionToken;
  }
}
