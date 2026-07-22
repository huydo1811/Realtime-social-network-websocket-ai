package com.social.pet.presentation.dto;

public record PetSocialBadgeResponse(
        String key,
        String title,
        String description,
        boolean unlocked,
        String progressText,
        String shareText) {
}
