package com.social.user.application.usecases;

import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;
import org.springframework.stereotype.Component;

@Component
public class GetUserByIdUseCase {
    private final UserRepository userRepository;
    public GetUserByIdUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    public User execute(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
    }
}