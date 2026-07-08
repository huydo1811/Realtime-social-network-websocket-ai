package com.social.moderation.infrastructure.failopen;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import com.social.moderation.domain.ModerationResult;
import com.social.moderation.domain.TextModerationService;

/**
 * Always returns {@code ALLOW} with {@link ModerationResult.Source#FALLBACK}.
 * Used when {@code moderation.enabled=false} — useful for local development
 * without the AI sidecar or to fully disable moderation in emergencies.
 */
@Service
@Primary
@ConditionalOnProperty(prefix = "moderation", name = "enabled", havingValue = "false")
public class DisabledTextModerationService implements TextModerationService {

    private static final Logger log = LoggerFactory.getLogger(DisabledTextModerationService.class);

    public DisabledTextModerationService() {
        log.warn("Text moderation is DISABLED (moderation.enabled=false). Content is never filtered.");
    }

    @Override
    public ModerationResult moderate(String text) {
        return ModerationResult.fallback("moderation_disabled", 0L);
    }
}