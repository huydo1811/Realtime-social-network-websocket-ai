package com.social.user.presentation.mapper;

import org.springframework.stereotype.Component;

import com.social.user.domain.entities.User;
import com.social.user.presentation.dto.UserViewDto;

@Component
public class UserMapper {
    public UserViewDto toDto(User u) {
        if (u == null) return null;
        UserViewDto d = new UserViewDto();
        d.setId(u.getId());
        d.setEmail(u.getEmail());
        d.setPhone(u.getPhone());
        d.setFullName(u.getFullName());
        d.setBio(u.getBio());
        d.setAvatarUrl(u.getAvatarUrl());
        d.setCoverUrl(u.getCoverUrl());
        d.setRole(u.getRole());
        d.setActive(u.getIsActive() != null ? u.getIsActive() : false);
        d.setCreatedAt(u.getCreatedAt());
        d.setUpdatedAt(u.getUpdatedAt());
        return d;
    }
}