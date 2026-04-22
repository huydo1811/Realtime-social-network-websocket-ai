package com.social.auth.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VerifyOtpDto {
    @NotBlank private String contact;
    @NotBlank @Pattern(regexp = "EMAIL|PHONE")
    private String contactType;
    @NotBlank private String code;
    @NotBlank @Pattern(regexp = "REGISTER|LOGIN|RESET_PASSWORD")
    private String purpose;

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    public String getContactType() { return contactType; }
    public void setContactType(String contactType) { this.contactType = contactType; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
}