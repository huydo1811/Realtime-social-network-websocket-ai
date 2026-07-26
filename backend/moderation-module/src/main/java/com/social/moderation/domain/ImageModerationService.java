package com.social.moderation.domain;

public interface ImageModerationService {
    ImageModerationResult moderate(String imageUrl);
}

