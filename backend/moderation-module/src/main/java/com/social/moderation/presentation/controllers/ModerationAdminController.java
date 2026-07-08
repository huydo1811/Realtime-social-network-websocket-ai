package com.social.moderation.presentation.controllers;

import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.social.moderation.domain.entities.ModerationAudit;
import com.social.moderation.domain.repositories.ModerationAuditRepository;
import com.social.moderation.presentation.dto.ModerationAuditResponse;
import com.social.moderation.presentation.dto.PagedResponse;

@RestController
@RequestMapping("/admin/moderation")
@PreAuthorize("hasRole('ADMIN')")
public class ModerationAdminController {

    private final ModerationAuditRepository auditRepository;

    public ModerationAdminController(ModerationAuditRepository auditRepository) {
        this.auditRepository = auditRepository;
    }

    @GetMapping("/audit")
    public ResponseEntity<PagedResponse<ModerationAuditResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Double minScore,
            @RequestParam(required = false) Boolean handled) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(size, 1), 100);
        var pageable = PageRequest.of(safePage, safeSize);
        Page<ModerationAudit> paged;
        if (minScore == null && handled == null) {
            paged = auditRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else if (minScore != null && handled == null) {
            paged = auditRepository.findByScoreGreaterThanEqualOrderByCreatedAtDesc(minScore, pageable);
        } else if (minScore == null) {
            paged = auditRepository.findAllByHandledOrderByCreatedAtDesc(Boolean.TRUE.equals(handled), pageable);
        } else {
            paged = auditRepository.findByScoreGreaterThanEqualAndHandledOrderByCreatedAtDesc(
                    minScore,
                    Boolean.TRUE.equals(handled),
                    pageable
            );
        }
        return ResponseEntity.ok(new PagedResponse<>(
                paged.getContent().stream().map(ModerationAuditResponse::from).toList(),
                safePage,
                safeSize,
                paged.getTotalElements(),
                paged.getTotalPages(),
                paged.hasNext(),
                paged.hasPrevious()
        ));
    }

    @PatchMapping("/audit/{auditId}/handled")
    @Transactional
    public ResponseEntity<ModerationAuditResponse> markHandled(@PathVariable Long auditId) {
        Long safeAuditId = Objects.requireNonNull(auditId, "auditId");
        ModerationAudit audit = auditRepository.findById(safeAuditId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bản ghi moderation"));
        audit.markHandled();
        ModerationAudit saved = auditRepository.save(audit);
        return ResponseEntity.ok(ModerationAuditResponse.from(saved));
    }
}