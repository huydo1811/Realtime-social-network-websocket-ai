package com.social.moderation.application.usecases;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.social.moderation.application.services.ModerationRuntimeConfigService;
import com.social.moderation.domain.ModerationAction;
import com.social.moderation.domain.ModerationPolicy;
import com.social.moderation.domain.ModerationResult;
import com.social.moderation.domain.TextModerationService;
import com.social.moderation.domain.entities.ModerationAudit;
import com.social.moderation.domain.entities.ModerationAudit.Action;
import com.social.moderation.domain.entities.ModerationAudit.Source;
import com.social.moderation.domain.entities.ModerationAudit.TargetType;
import com.social.moderation.domain.repositories.ModerationAuditRepository;

@Service
public class ModerateTextUseCase {

    private static final Logger log = LoggerFactory.getLogger(ModerateTextUseCase.class);

    private final TextModerationService moderationService;
    private final ModerationAuditRepository auditRepository;
    private final ModerationRuntimeConfigService runtimeConfig;

    public ModerateTextUseCase(
            TextModerationService moderationService,
            ModerationAuditRepository auditRepository,
            ModerationRuntimeConfigService runtimeConfig) {
        this.moderationService = moderationService;
        this.auditRepository = auditRepository;
        this.runtimeConfig = runtimeConfig;
    }

    public ModerationDecision moderate(String text) {
        ModerationPolicy policy = runtimeConfig.textPolicy();
        if (!runtimeConfig.isTextEnabled()) {
            ModerationResult disabled = ModerationResult.fallback("text_moderation_disabled", 0L);
            return new ModerationDecision(disabled, ModerationAction.ALLOW);
        }
        ModerationResult result = moderationService.moderate(text);
        ModerationAction action = result.source() == ModerationResult.Source.FALLBACK
                ? ModerationAction.ALLOW
                : policy.resolve(result.score());
        return new ModerationDecision(result, action);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void audit(
            TargetType targetType,
            Long targetId,
            Long authorUserId,
            String text,
            ModerationDecision decision) {
        if (text == null) text = "";
        ModerationPolicy policy = runtimeConfig.textPolicy();
        ModerationResult result = decision.result();
        Action auditAction = result.source() == ModerationResult.Source.FALLBACK
                ? Action.FALLBACK
                : switch (decision.action()) {
                    case ALLOW -> Action.ALLOW;
                    case SOFT_HIDE -> Action.SOFT_HIDE;
                    case HARD_REJECT -> Action.HARD_REJECT;
                };
        ModerationAudit audit = ModerationAudit.of(
                targetType,
                targetId,
                authorUserId,
                sha256(text),
                preview(text),
                result.modelName(),
                runtimeConfig.activeTextModelVersion(),
                result.score(),
                policy.allowThreshold(),
                policy.rejectThreshold(),
                result.source() == ModerationResult.Source.AI ? Source.AI : Source.FALLBACK,
                auditAction,
                result.inferenceMs()
        );
        auditRepository.save(audit);
    }

    private static String preview(String text) {
        if (text == null) return null;
        String trimmed = text.strip();
        return trimmed.length() > 500 ? trimmed.substring(0, 500) : trimmed;
    }

    private static String sha256(String text) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(text == null ? new byte[0] : text.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            log.warn("SHA-256 unavailable, falling back to plain hash", e);
            return Integer.toHexString((text == null ? "" : text).hashCode());
        }
    }

    public record ModerationDecision(ModerationResult result, ModerationAction action) { }
}
