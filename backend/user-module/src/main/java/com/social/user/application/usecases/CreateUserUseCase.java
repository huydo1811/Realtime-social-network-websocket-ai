package com.social.user.application.usecases;

import com.social.user.application.services.PasswordService;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;
import org.springframework.stereotype.Component;
import java.sql.Timestamp;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional
public class CreateUserUseCase {
    private final UserRepository userRepository;
    private final PasswordService passwordService;

    public CreateUserUseCase(UserRepository userRepository, PasswordService passwordService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
    }

    public User execute(String email, String phone, String password, String fullName, String bio, String avatarUrl, String coverUrl, String role) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email đã tồn tại");
        }
        if (userRepository.findByPhone(phone).isPresent()) {
            throw new RuntimeException("Số điện thoại đã tồn tại");
        }
        String passwordHash = passwordService.hashPassword(password);
        User user = new User(null, email, phone, passwordHash, fullName, bio, avatarUrl, coverUrl, role, true, new Timestamp(System.currentTimeMillis()), new Timestamp(System.currentTimeMillis()));
        return userRepository.save(user);
    }
}
