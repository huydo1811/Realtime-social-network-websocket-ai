package com.social.post.presentation.controllers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.post.application.usecases.CreateCommentReportUseCase;
import com.social.post.application.usecases.CreatePostReportUseCase;
import com.social.post.application.usecases.ListContentReportsUseCase;
import com.social.post.application.usecases.ResolveContentReportUseCase;
import com.social.post.presentation.dto.ContentReportRequest;
import com.social.post.presentation.dto.ContentReportResponse;
import com.social.post.presentation.dto.ResolveContentReportRequest;
import com.social.post.presentation.mapper.ContentReportMapper;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/reports")
public class ContentReportController {
    private final CreatePostReportUseCase createPostReportUseCase;
    private final CreateCommentReportUseCase createCommentReportUseCase;
    private final ListContentReportsUseCase listContentReportsUseCase;
    private final ResolveContentReportUseCase resolveContentReportUseCase;
    private final ContentReportMapper contentReportMapper;

    public ContentReportController(
            CreatePostReportUseCase createPostReportUseCase,
            CreateCommentReportUseCase createCommentReportUseCase,
            ListContentReportsUseCase listContentReportsUseCase,
            ResolveContentReportUseCase resolveContentReportUseCase,
            ContentReportMapper contentReportMapper) {
        this.createPostReportUseCase = createPostReportUseCase;
        this.createCommentReportUseCase = createCommentReportUseCase;
        this.listContentReportsUseCase = listContentReportsUseCase;
        this.resolveContentReportUseCase = resolveContentReportUseCase;
        this.contentReportMapper = contentReportMapper;
    }

    @PostMapping("/posts/{postId}")
    public ResponseEntity<ContentReportResponse> reportPost(
            @PathVariable Long postId,
            @Valid @RequestBody ContentReportRequest request) {
        Long actorId = currentUserId();
        var report = createPostReportUseCase.execute(actorId, postId, request.getReason());
        return ResponseEntity.ok(contentReportMapper.toResponse(report));
    }

    @PostMapping("/comments/{commentId}")
    public ResponseEntity<ContentReportResponse> reportComment(
            @PathVariable Long commentId,
            @Valid @RequestBody ContentReportRequest request) {
        Long actorId = currentUserId();
        var report = createCommentReportUseCase.execute(actorId, commentId, request.getReason());
        return ResponseEntity.ok(contentReportMapper.toResponse(report));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<Page<ContentReportResponse>> listReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(size, 1), 100));
        Page<ContentReportResponse> response = listContentReportsUseCase.execute(status, pageable)
                .map(contentReportMapper::toResponse);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/admin/{reportId}/resolve")
    public ResponseEntity<ContentReportResponse> resolveReport(
            @PathVariable Long reportId,
            @RequestBody(required = false) ResolveContentReportRequest request) {
        Long adminUserId = currentUserId();
        String note = request == null ? null : request.getNote();
        var report = resolveContentReportUseCase.resolve(reportId, adminUserId, note, true);
        return ResponseEntity.ok(contentReportMapper.toResponse(report));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/admin/{reportId}/reject")
    public ResponseEntity<ContentReportResponse> rejectReport(
            @PathVariable Long reportId,
            @RequestBody(required = false) ResolveContentReportRequest request) {
        Long adminUserId = currentUserId();
        String note = request == null ? null : request.getNote();
        var report = resolveContentReportUseCase.resolve(reportId, adminUserId, note, false);
        return ResponseEntity.ok(contentReportMapper.toResponse(report));
    }

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new IllegalArgumentException("Vui lòng đăng nhập để thực hiện thao tác này");
        }
        try {
            return Long.parseLong(String.valueOf(auth.getPrincipal()));
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Token không hợp lệ");
        }
    }
}
