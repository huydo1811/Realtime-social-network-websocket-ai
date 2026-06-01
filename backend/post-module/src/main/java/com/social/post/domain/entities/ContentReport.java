package com.social.post.domain.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "content_reports")
public class ContentReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private ReportTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "post_id")
    private Long postId;

    @Column(name = "reporter_user_id", nullable = false)
    private Long reporterUserId;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ContentReportStatus status;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @Column(name = "resolved_by")
    private Long resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected ContentReport() {
    }

    public static ContentReport createPostReport(Long reporterUserId, Long postId, String reason) {
        ContentReport report = new ContentReport();
        report.targetType = ReportTargetType.POST;
        report.targetId = postId;
        report.postId = postId;
        report.reporterUserId = reporterUserId;
        report.reason = normalizeReason(reason);
        report.status = ContentReportStatus.PENDING;
        return report;
    }

    public static ContentReport createCommentReport(Long reporterUserId, Long commentId, Long postId, String reason) {
        ContentReport report = new ContentReport();
        report.targetType = ReportTargetType.COMMENT;
        report.targetId = commentId;
        report.postId = postId;
        report.reporterUserId = reporterUserId;
        report.reason = normalizeReason(reason);
        report.status = ContentReportStatus.PENDING;
        return report;
    }

    public void resolve(Long adminUserId, String note) {
        this.status = ContentReportStatus.RESOLVED;
        this.resolvedBy = adminUserId;
        this.adminNote = normalizeOptional(note);
        this.resolvedAt = LocalDateTime.now();
    }

    public void reject(Long adminUserId, String note) {
        this.status = ContentReportStatus.REJECTED;
        this.resolvedBy = adminUserId;
        this.adminNote = normalizeOptional(note);
        this.resolvedAt = LocalDateTime.now();
    }

    private static String normalizeReason(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Lý do báo cáo không được để trống");
        }
        if (normalized.length() > 1000) {
            throw new IllegalArgumentException("Lý do báo cáo vượt quá 1000 ký tự");
        }
        return normalized;
    }

    private static String normalizeOptional(String value) {
        String normalized = value == null ? null : value.trim();
        if (normalized == null || normalized.isBlank()) return null;
        return normalized.length() > 1000 ? normalized.substring(0, 1000) : normalized;
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public ReportTargetType getTargetType() {
        return targetType;
    }

    public Long getTargetId() {
        return targetId;
    }

    public Long getPostId() {
        return postId;
    }

    public Long getReporterUserId() {
        return reporterUserId;
    }

    public String getReason() {
        return reason;
    }

    public ContentReportStatus getStatus() {
        return status;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public Long getResolvedBy() {
        return resolvedBy;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
