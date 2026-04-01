package com.social.auth.application.usecases;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.social.auth.presentation.dto.RegisterDto;
import com.social.user.application.usecases.CreateUserUseCase;
import com.social.user.domain.entities.User;

@Component
@Transactional
public class RegisterUseCase {
    private final CreateUserUseCase createUserUseCase;

    public RegisterUseCase(CreateUserUseCase createUserUseCase) {
        this.createUserUseCase = createUserUseCase;
    }

    public User execute(RegisterDto dto) {
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