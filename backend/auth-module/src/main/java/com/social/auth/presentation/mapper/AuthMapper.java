package com.social.auth.presentation.mapper;

import org.springframework.stereotype.Component;

import com.social.auth.presentation.dto.ProfileDto;
import com.social.user.domain.entities.User;

@Component
public class AuthMapper {
    public ProfileDto toProfileDto(User u) {
        if (u == null) return null;
        ProfileDto d = new ProfileDto();
        d.setId(u.getId());
        d.setEmail(u.getEmail());
        d.setPhone(u.getPhone());
        d.setFullName(u.getFullName());
        d.setBio(u.getBio());
        d.setAvatarUrl(u.getAvatarUrl());
        d.setCoverUrl(u.getCoverUrl());
        d.setRole(u.getRole());
        d.setActive(Boolean.TRUE.equals(u.getIsActive()));
        d.setCreatedAt(u.getCreatedAt());
        d.setUpdatedAt(u.getUpdatedAt());
        return d;
    }
}