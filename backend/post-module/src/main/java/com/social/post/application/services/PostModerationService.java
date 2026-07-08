package com.social.post.application.services;

import com.social.moderation.application.usecases.ModerateTextUseCase;
import com.social.moderation.application.usecases.ModerateTextUseCase.ModerationDecision;
import com.social.moderation.domain.ModerationAction;
import com.social.moderation.domain.ModerationResult;
import com.social.moderation.domain.entities.ModerationAudit.TargetType;
import com.social.post.domain.exceptions.PostModerationRejectedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Thin adapter that runs moderation against post/comment text and translates
 * the resulting {@link ModerationAction} into the post-domain vocabulary.
 *
 * <ul>
 *   <li>{@code HARD_REJECT} → throws {@link PostModerationRejectedException}</li>
 *   <li>{@code SOFT_HIDE}   → caller should mark the entity as {@code PENDING}</li>
 *   <li>{@code ALLOW}       → no further action</li>
 * </ul>
 */
@Service
public class PostModerationService {

    private static final Logger log = LoggerFactory.getLogger(PostModerationService.class);

    private final ModerateTextUseCase moderateTextUseCase;

    public PostModerationService(ModerateTextUseCase moderateTextUseCase) {
        this.moderateTextUseCase = moderateTextUseCase;
    }

    /**
     * Run moderation against the text. Either throws (hard reject), or returns
     * an {@link Outcome} the caller can use to update entity state and persist
     * an audit row.
     */
    public Outcome enforce(String text) {
        if (text == null || text.isBlank()) {
            return Outcome.allowed();
        }
        ModerationDecision decision = moderateTextUseCase.moderate(text);
        ModerationResult result = decision.result();
        ModerationAction action = decision.action();
        return switch (action) {
            case HARD_REJECT -> {
                log.warn("Hard-rejecting content (score={}, model={})", result.score(), result.modelName());
                throw new PostModerationRejectedException(result);
            }
            case SOFT_HIDE -> {
                log.info("Soft-hiding content (score={}, model={})", result.score(), result.modelName());
                yield Outcome.softHidden(result);
            }
            case ALLOW -> Outcome.allowed(result);
        };
    }

    /**
     * Persist a moderation audit row. Callers should invoke this exactly once
     * per moderated content, regardless of the resulting action.
     */
    public void audit(TargetType targetType, Long targetId, Long authorUserId, String text, Outcome outcome) {
        moderateTextUseCase.audit(
                targetType,
                targetId,
                authorUserId,
                text,
                new ModerationDecision(outcome.result(), outcome.action())
        );
    }

    /** Result of {@link #enforce(String)} — used by callers to mutate entities and audit. */
    public record Outcome(ModerationAction action, ModerationResult result) {
        public boolean softHide() {
            return action == ModerationAction.SOFT_HIDE;
        }
        public static Outcome allowed() {
            return new Outcome(ModerationAction.ALLOW, ModerationResult.fallback("empty_or_allow", 0L));
        }
        public static Outcome allowed(ModerationResult result) {
            return new Outcome(ModerationAction.ALLOW, result);
        }
        public static Outcome softHidden(ModerationResult result) {
            return new Outcome(ModerationAction.SOFT_HIDE, result);
        }
    }
}