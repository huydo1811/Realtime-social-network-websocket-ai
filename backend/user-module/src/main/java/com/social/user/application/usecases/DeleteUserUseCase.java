package com.social.user.application.usecases;

import java.sql.Timestamp;

import org.springframework.stereotype.Component;

import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@Component
public class DeleteUserUseCase {
    private final UserRepository userRepository;

    public DeleteUserUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void execute(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
        user.setIsActive(false);
        user.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
        userRepository.save(user);
    }
}
