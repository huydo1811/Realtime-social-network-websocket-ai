package com.social.moderation.domain.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.social.moderation.domain.entities.ModerationAudit;

public interface ModerationAuditRepository extends JpaRepository<ModerationAudit, Long> {

    Page<ModerationAudit> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<ModerationAudit> findByScoreGreaterThanEqualOrderByCreatedAtDesc(double minScore, Pageable pageable);

    Page<ModerationAudit> findAllByHandledOrderByCreatedAtDesc(boolean handled, Pageable pageable);

    Page<ModerationAudit> findByScoreGreaterThanEqualAndHandledOrderByCreatedAtDesc(
            double minScore,
            boolean handled,
            Pageable pageable
    );
}