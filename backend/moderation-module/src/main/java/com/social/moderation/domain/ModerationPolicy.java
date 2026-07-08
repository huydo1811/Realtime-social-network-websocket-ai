package com.social.moderation.domain;

/**
 * Tunable thresholds mapping a raw score into a {@link ModerationAction}.
 *
 * <p>Defaults:
 * <pre>
 *   score &lt; allow          → ALLOW
 *   allow ≤ score &lt; reject → SOFT_HIDE
 *   score ≥ reject          → HARD_REJECT
 * </pre>
 */
public record ModerationPolicy(double allowThreshold, double rejectThreshold) {

    public ModerationPolicy {
        if (allowThreshold < 0.0 || allowThreshold > 1.0) {
            throw new IllegalArgumentException("allowThreshold must be in [0,1]");
        }
        if (rejectThreshold < 0.0 || rejectThreshold > 1.0) {
            throw new IllegalArgumentException("rejectThreshold must be in [0,1]");
        }
        if (rejectThreshold <= allowThreshold) {
            throw new IllegalArgumentException("rejectThreshold must be strictly greater than allowThreshold");
        }
    }

    public static ModerationPolicy of(double allow, double reject) {
        return new ModerationPolicy(allow, reject);
    }

    public ModerationAction resolve(double score) {
        if (score >= rejectThreshold) return ModerationAction.HARD_REJECT;
        if (score >= allowThreshold) return ModerationAction.SOFT_HIDE;
        return ModerationAction.ALLOW;
    }
}