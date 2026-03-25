package com.social.user.application.usecases;

import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@Component
public class SearchUsersUseCase {
    private final UserRepository userRepository;
    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 20;

    public SearchUsersUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Page<User> execute(String email, String fullName, Boolean isActive, Pageable pageable) {
        String e = normalize(email);
        String f = normalize(fullName);
        Pageable pg = pageable != null ? pageable : PageRequest.of(DEFAULT_PAGE, DEFAULT_SIZE);
        try {
            return userRepository.search(e, f, isActive, pg);
        } catch (DataAccessException ex) {
            throw new RuntimeException("Failed to search users", ex);
        }
    }

    private String normalize(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
