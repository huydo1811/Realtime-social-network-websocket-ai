package com.social.moderation.application.usecases;

import java.time.Instant;

import org.springframework.stereotype.Service;

import com.social.moderation.application.services.ModerationRuntimeConfigService;
import com.social.moderation.domain.ImageModerationResult;
import com.social.moderation.domain.ImageModerationService;
import com.social.moderation.infrastructure.config.ModerationProperties;

@Service
public class ModerateImageUseCase {
    private final ImageModerationService imageModerationService;
    private final ModerationProperties properties;
    private final ModerationRuntimeConfigService runtimeConfig;

    public ModerateImageUseCase(
            ImageModerationService imageModerationService,
            ModerationProperties properties,
            ModerationRuntimeConfigService runtimeConfig) {
        this.imageModerationService = imageModerationService;
        this.properties = properties;
        this.runtimeConfig = runtimeConfig;
    }

    public ImageModerationResult moderate(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return ImageModerationResult.fallback("empty_url", 0L);
        }
        if (!runtimeConfig.isImageEnabled()) {
            return ImageModerationResult.fallback("image_moderation_disabled", 0L);
        }
        ImageModerationResult result = imageModerationService.moderate(imageUrl);
        if (!properties.isImageFailOpen()
                && result.source() == ImageModerationResult.Source.FALLBACK
                && isServiceFailure(result.reason())) {
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
        if (result.source() == ImageModerationResult.Source.AI) {
            double threshold = runtimeConfig.imageThreshold();
            boolean violation = result.score() >= threshold;
            return new ImageModerationResult(
                    violation,
                    result.score(),
                    threshold,
                    result.modelName(),
                    violation ? "non_pet_detected" : "pet_or_uncertain",
                    result.predictedLabel(),
                    result.inferenceMs(),
                    result.source(),
                    Instant.now()
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
