package com.social.friendship.domain.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "group_member_reports")
public class GroupMemberReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(name = "reported_user_id", nullable = false)
    private Long reportedUserId;

    @Column(name = "reporter_user_id", nullable = false)
    private Long reporterUserId;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "owner_note", columnDefinition = "TEXT")
    private String ownerNote;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected GroupMemberReport() {
    }

    public static GroupMemberReport create(Long groupId, Long reportedUserId, Long reporterUserId, String reason) {
        GroupMemberReport row = new GroupMemberReport();
        row.groupId = groupId;
        row.reportedUserId = reportedUserId;
        row.reporterUserId = reporterUserId;
        String normalized = reason == null ? "" : reason.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Lý do báo cáo không được để trống");
        }
        if (normalized.length() > 1000) {
            throw new IllegalArgumentException("Lý do báo cáo vượt quá 1000 ký tự");
        }
        row.reason = normalized;
        row.status = "PENDING";
        return row;
    }

    public void resolve(String note) {
        this.status = "RESOLVED";
        this.ownerNote = note == null ? null : note.trim();
        this.resolvedAt = LocalDateTime.now();
    }

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getGroupId() {
        return groupId;
    }

    public Long getReportedUserId() {
        return reportedUserId;
    }

    public Long getReporterUserId() {
        return reporterUserId;
    }

    public String getReason() {
        return reason;
    }

    public String getStatus() {
        return status;
    }

    public String getOwnerNote() {
        return ownerNote;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
