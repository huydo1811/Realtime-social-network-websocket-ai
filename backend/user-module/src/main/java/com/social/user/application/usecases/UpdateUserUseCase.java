package com.social.user.application.usecases;

import java.sql.Timestamp;

import org.springframework.stereotype.Component;

import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;
import com.social.user.presentation.dto.UpdateUserDto;

@Component
public class UpdateUserUseCase {
    private final UserRepository userRepository;

    public UpdateUserUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User executeAdmin(Long id, UpdateUserDto dto) {
        User user = loadAndApplyCommonFields(id, dto);
        if (dto.getRole() != null) user.setRole(normalizeRole(dto.getRole()));
        if (dto.getIsActive() != null) user.setIsActive(dto.getIsActive());
        user.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
        return userRepository.save(user);
    }

    public User executeSelf(Long id, UpdateUserDto dto) {
        User user = loadAndApplyCommonFields(id, dto);
        user.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
        return userRepository.save(user);
    }

    private User loadAndApplyCommonFields(Long id, UpdateUserDto dto) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())) {
            userRepository.findByEmail(dto.getEmail()).ifPresent(u -> {
                if (!u.getId().equals(id)) throw new RuntimeException("Email đã tồn tại");
            });
            user.setEmail(dto.getEmail());
        }

        if (dto.getPhone() != null && !dto.getPhone().equals(user.getPhone())) {
            userRepository.findByPhone(dto.getPhone()).ifPresent(u -> {
                if (!u.getId().equals(id)) throw new RuntimeException("Số điện thoại đã tồn tại");
            });
            user.setPhone(dto.getPhone());
        }

        if (dto.getFullName() != null) user.setFullName(dto.getFullName());
        if (dto.getBio() != null) user.setBio(dto.getBio());
        if (dto.getAvatarUrl() != null) user.setAvatarUrl(dto.getAvatarUrl());
        if (dto.getCoverUrl() != null) user.setCoverUrl(dto.getCoverUrl());

        return user;
    }

    private String normalizeRole(String role) {
        String r = role == null ? "USER" : role.trim().toUpperCase();
        if (r.startsWith("ROLE_")) r = r.substring(5);
        return r.isBlank() ? "USER" : r;
    }
}
