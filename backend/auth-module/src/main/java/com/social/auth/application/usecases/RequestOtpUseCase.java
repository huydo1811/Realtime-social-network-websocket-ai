package com.social.auth.application.usecases;

import org.springframework.stereotype.Service;

import com.social.auth.infrastructure.service.OtpService;
import com.social.user.domain.repositories.UserRepository;

@Service
public class RequestOtpUseCase {
    private final OtpService otpService;
    private final UserRepository userRepository;

    public RequestOtpUseCase(OtpService otpService, UserRepository userRepository) {
        this.otpService = otpService;
        this.userRepository = userRepository;
    }

    public void execute(String contact, String contactType, String purpose) {
        if ("EMAIL".equalsIgnoreCase(contactType)) {
            boolean isExist = userRepository.findByEmail(contact).isPresent();
            
            if ("REGISTER".equalsIgnoreCase(purpose) && isExist) {
                throw new IllegalArgumentException("EMAIL_ALREADY_EXISTS");
            }
            
            if (("LOGIN".equalsIgnoreCase(purpose) || "RESET_PASSWORD".equalsIgnoreCase(purpose)) && !isExist) {
                throw new IllegalArgumentException("EMAIL_NOT_FOUND");
            }
        }
        
        otpService.generateAndSend(contact, contactType, purpose);
    }
}