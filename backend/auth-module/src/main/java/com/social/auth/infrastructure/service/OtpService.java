package com.social.auth.infrastructure.service;

public interface OtpService {
    void generateAndSend(String contact, String contactType, String purpose);

    String verifyAndIssueSessionToken(String contact, String contactType, String code, String purpose);

    void consumeVerifiedSession(String otpSessionToken, String contact, String contactType, String purpose);
}