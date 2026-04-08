package com.social.auth.application.usecases;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.social.auth.infrastructure.service.OtpService;
import com.social.auth.presentation.dto.RegisterDto;
import com.social.user.application.usecases.CreateUserUseCase;
import com.social.user.domain.entities.User;

@Component
@Transactional
public class RegisterUseCase {
    private final CreateUserUseCase createUserUseCase;
    private final OtpService otpService;

    public RegisterUseCase(CreateUserUseCase createUserUseCase, OtpService otpService) {
        this.createUserUseCase = createUserUseCase;
        this.otpService = otpService;
    }

    public User execute(RegisterDto dto) {
        otpService.consumeVerifiedSession(dto.getOtpSessionToken(), dto.getEmail(), "EMAIL", "REGISTER");

        return createUserUseCase.execute(
            dto.getEmail(),
            dto.getPhone(),
            dto.getPassword(),
            dto.getFullName(),
            dto.getBio(),
            dto.getAvatarUrl(),
            dto.getCoverUrl(),
            dto.getRole()
        );
    }
}