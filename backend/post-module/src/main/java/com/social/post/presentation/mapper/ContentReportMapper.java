package com.social.post.presentation.mapper;

import org.springframework.stereotype.Component;

import com.social.post.domain.entities.ContentReport;
import com.social.post.domain.entities.ReportTargetType;
import com.social.post.domain.repositories.PostCommentRepository;
import com.social.post.domain.repositories.PostRepository;
import com.social.post.presentation.dto.ContentReportResponse;

@Component
public class ContentReportMapper {
    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;

    public ContentReportMapper(
            PostRepository postRepository,
            PostCommentRepository postCommentRepository) {
        this.postRepository = postRepository;
        this.postCommentRepository = postCommentRepository;
    }

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
        if (report.getTargetType() == ReportTargetType.POST) {
            postRepository.findById(report.getTargetId()).ifPresent(post -> {
                response.setTargetAuthorUserId(post.getAuthorId());
                response.setTargetContent(post.getContent());
            });
        } else if (report.getTargetType() == ReportTargetType.COMMENT) {
            postCommentRepository.findById(report.getTargetId()).ifPresent(comment -> {
                response.setTargetAuthorUserId(comment.getUserId());
                response.setTargetContent(comment.getContent());
                postRepository.findById(comment.getPostId())
                        .ifPresent(post -> response.setRelatedPostContent(post.getContent()));
            });
        }
        return response;
    }
}
