package com.social.user.application.usecases;

import java.util.List;

import org.springframework.stereotype.Component;

import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@Component
public class GetAllUserUseCase {
    private final UserRepository userRepository;

    public GetAllUserUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> execute() {
        return userRepository.findAll();
    }
}
