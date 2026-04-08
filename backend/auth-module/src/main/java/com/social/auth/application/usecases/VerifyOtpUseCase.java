package com.social.auth.application.usecases;
import org.springframework.stereotype.Service;

import com.social.auth.infrastructure.service.OtpService;

@Service
public class VerifyOtpUseCase {
    private final OtpService otpService;
    public VerifyOtpUseCase(OtpService otpService){ this.otpService = otpService; }
    public String execute(String contact, String contactType, String code, String purpose) {
        return otpService.verifyAndIssueSessionToken(contact, contactType, code, purpose);
    }
}