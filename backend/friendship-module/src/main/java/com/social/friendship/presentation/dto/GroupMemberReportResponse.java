package com.social.friendship.presentation.dto;

import java.time.LocalDateTime;

import com.social.friendship.domain.entities.GroupMemberReport;
import com.social.user.domain.entities.User;

public record GroupMemberReportResponse(
        Long id,
        Long groupId,
        Long reportedUserId,
        String reportedUserName,
        Long reporterUserId,
        String reporterUserName,
        String reason,
        String status,
        String ownerNote,
        LocalDateTime resolvedAt,
        LocalDateTime createdAt) {

    public static GroupMemberReportResponse from(
            GroupMemberReport row,
            User reported,
            User reporter) {
        return new GroupMemberReportResponse(
                row.getId(),
                row.getGroupId(),
                row.getReportedUserId(),
                reported == null ? null : reported.getFullName(),
                row.getReporterUserId(),
                reporter == null ? null : reporter.getFullName(),
                row.getReason(),
                row.getStatus(),
                row.getOwnerNote(),
                row.getResolvedAt(),
                row.getCreatedAt());
    }
}
