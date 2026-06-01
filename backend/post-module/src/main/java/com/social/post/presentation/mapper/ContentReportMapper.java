package com.social.post.presentation.mapper;

import org.springframework.stereotype.Component;

import com.social.post.domain.entities.ContentReport;
import com.social.post.presentation.dto.ContentReportResponse;

@Component
public class ContentReportMapper {
    public ContentReportResponse toResponse(ContentReport report) {
        ContentReportResponse response = new ContentReportResponse();
        response.setId(report.getId());
        response.setTargetType(report.getTargetType().name());
        response.setTargetId(report.getTargetId());
        response.setPostId(report.getPostId());
        response.setReporterUserId(report.getReporterUserId());
        response.setReason(report.getReason());
        response.setStatus(report.getStatus().name());
        response.setAdminNote(report.getAdminNote());
        response.setResolvedBy(report.getResolvedBy());
        response.setResolvedAt(report.getResolvedAt());
        response.setCreatedAt(report.getCreatedAt());
        response.setUpdatedAt(report.getUpdatedAt());
        return response;
    }
}
