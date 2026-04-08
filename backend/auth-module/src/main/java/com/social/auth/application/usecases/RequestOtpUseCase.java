package com.social.auth.application.usecases;

import org.springframework.stereotype.Service;

import com.social.auth.infrastructure.service.OtpService;

@Service
public class RequestOtpUseCase {
    private final OtpService otpService;

    public RequestOtpUseCase(OtpService otpService) {
        this.otpService = otpService;
    }

    public void execute(String contact, String contactType, String purpose) {
        otpService.generateAndSend(contact, contactType, purpose);
    }
}