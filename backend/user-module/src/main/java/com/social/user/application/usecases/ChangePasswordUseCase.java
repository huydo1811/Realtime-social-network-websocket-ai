package com.social.user.application.usecases;

import java.sql.Timestamp;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.social.user.application.services.PasswordService;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@Component
@Transactional
public class ChangePasswordUseCase {
    private final UserRepository userRepository;
    private final PasswordService passwordService;

    public ChangePasswordUseCase(UserRepository userRepository, PasswordService passwordService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
    }

    public User execute(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
        if (!passwordService.verifyPassword(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");
        }
        user.setPasswordHash(passwordService.hashPassword(newPassword));
        user.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
        return userRepository.save(user);
    }
}
