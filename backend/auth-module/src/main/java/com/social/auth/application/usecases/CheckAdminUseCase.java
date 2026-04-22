package com.social.auth.application.usecases;

import org.springframework.stereotype.Service;

import com.social.user.domain.repositories.UserRepository;

@Service
public class CheckAdminUseCase {
    private final UserRepository userRepository;

    public CheckAdminUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public boolean execute(String email) {
        return userRepository.findByEmail(email)
                .map(user -> "ADMIN".equals(user.getRole()) || "ROLE_ADMIN".equals(user.getRole()))
                .orElse(false);
    }
}
