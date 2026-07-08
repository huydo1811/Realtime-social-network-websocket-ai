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

import com.social.moderation.domain.ModerationAction;
import com.social.moderation.domain.ModerationPolicy;
import com.social.moderation.domain.ModerationResult;
import com.social.moderation.domain.TextModerationService;
import com.social.moderation.domain.entities.ModerationAudit;
import com.social.moderation.domain.entities.ModerationAudit.Action;
import com.social.moderation.domain.entities.ModerationAudit.Source;
import com.social.moderation.domain.entities.ModerationAudit.TargetType;
import com.social.moderation.domain.repositories.ModerationAuditRepository;
import com.social.moderation.infrastructure.config.ModerationProperties;

/**
 * Application service that combines {@link TextModerationService} and
 * {@link ModerationPolicy} into a single call, then writes an audit row.
 *
 * <p>Audit persistence uses {@link Propagation#REQUIRES_NEW} so that logging
 * a moderation decision never rolls back the surrounding business transaction
 * (which is the right behaviour even on hard reject).</p>
 */
@Service
public class ModerateTextUseCase {

    private static final Logger log = LoggerFactory.getLogger(ModerateTextUseCase.class);

    private final TextModerationService moderationService;
    private final ModerationPolicy policy;
    private final ModerationAuditRepository auditRepository;
    private final String modelVersion;

    public ModerateTextUseCase(
            TextModerationService moderationService,
            ModerationProperties properties,
            ModerationAuditRepository auditRepository) {
        this.moderationService = moderationService;
        this.policy = ModerationPolicy.of(properties.getAllowThreshold(), properties.getRejectThreshold());
        this.auditRepository = auditRepository;
        this.modelVersion = properties.getDefaultModelName();
    }

    public ModerationDecision moderate(String text) {
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
                modelVersion,
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