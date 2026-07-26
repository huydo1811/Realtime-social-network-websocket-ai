package com.social.moderation.infrastructure.failopen;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.social.moderation.domain.ImageModerationResult;
import com.social.moderation.domain.ImageModerationService;

@Service
@ConditionalOnProperty(prefix = "moderation", name = "enabled", havingValue = "false")
public class DisabledImageModerationService implements ImageModerationService {
    @Override
    public ImageModerationResult moderate(String imageUrl) {
        return ImageModerationResult.fallback("moderation_disabled", 0L);
    }
}

