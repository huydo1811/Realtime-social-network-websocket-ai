package com.social.moderation.domain;

/**
 * Action derived from the raw {@link ModerationResult}.
 */
public enum ModerationAction {
    /** Allow the content as-is (status {@code APPROVED}). */
    ALLOW,
    /** Save but mark as {@code PENDING} — hidden from public feeds, awaiting admin review. */
    SOFT_HIDE,
    /** Hard-reject — caller should throw an exception and not persist the content. */
    HARD_REJECT
}