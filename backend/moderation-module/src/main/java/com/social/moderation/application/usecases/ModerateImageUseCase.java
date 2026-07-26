package com.social.moderation.application.usecases;

import org.springframework.stereotype.Service;

import com.social.moderation.domain.ImageModerationResult;
import com.social.moderation.domain.ImageModerationService;
import com.social.moderation.infrastructure.config.ModerationProperties;

@Service
public class ModerateImageUseCase {
    private final ImageModerationService imageModerationService;
    private final ModerationProperties properties;

    public ModerateImageUseCase(
            ImageModerationService imageModerationService,
            ModerationProperties properties) {
        this.imageModerationService = imageModerationService;
        this.properties = properties;
    }

    public ImageModerationResult moderate(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return ImageModerationResult.fallback("empty_url", 0L);
        }
        ImageModerationResult result = imageModerationService.moderate(imageUrl);
        if (!properties.isImageFailOpen()
                && result.source() == ImageModerationResult.Source.FALLBACK
                && isServiceFailure(result.reason())) {
            // Fail-closed for pet filter: do not silently allow images when AI is down/slow.
            return new ImageModerationResult(
                    true,
                    1.0,
                    result.threshold(),
                    result.modelName(),
                    result.reason(),
                    "unavailable",
                    result.inferenceMs(),
                    result.source(),
                    result.createdAt()
            );
        }
        return result;
    }

    private static boolean isServiceFailure(String reason) {
        if (reason == null || reason.isBlank()) {
            return false;
        }
        String value = reason.toLowerCase();
        return value.startsWith("service_unavailable")
                || value.startsWith("error:")
                || value.equals("empty_body")
                || value.equals("bad_json");
    }
}

