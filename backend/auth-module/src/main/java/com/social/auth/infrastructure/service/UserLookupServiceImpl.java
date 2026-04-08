package com.social.auth.infrastructure.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.social.user.application.usecases.CreateUserUseCase;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@Service
public class UserLookupServiceImpl implements UserLookupService {

    private final UserRepository userRepository;
    private final CreateUserUseCase createUserUseCase;

    public UserLookupServiceImpl(UserRepository userRepository, CreateUserUseCase createUserUseCase) {
        this.userRepository = userRepository;
        this.createUserUseCase = createUserUseCase;
    }

    @Override
    public User resolveOrCreateByContact(String contact, String contactType) {
        if ("EMAIL".equalsIgnoreCase(contactType)) {
            return userRepository.findByEmail(contact)
                .orElseGet(() -> createUserUseCase.execute(contact, null, UUID.randomUUID().toString(), "OTP_USER", null, null, null, "USER"));
        } else {
            return userRepository.findByPhone(contact)
                .orElseGet(() -> createUserUseCase.execute(null, contact, UUID.randomUUID().toString(), "OTP_USER", null, null, null, "USER"));
        }
    }
}