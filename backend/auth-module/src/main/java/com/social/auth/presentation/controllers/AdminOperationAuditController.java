package com.social.auth.presentation.controllers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.auth.application.services.AdminOperationAuditService;
import com.social.auth.domain.entities.AdminOperationAuditLog;
import com.social.auth.presentation.dto.AdminOperationAuditLogResponse;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/admin")
public class AdminOperationAuditController {

    private final AdminOperationAuditService auditService;

    public AdminOperationAuditController(AdminOperationAuditService auditService) {
        this.auditService = auditService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/audit-logs")
    public ResponseEntity<Map<String, Object>> listAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long adminUserId,
            @RequestParam(required = false) String httpMethod,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        int safeSize = Math.min(Math.max(size, 1), 1000);
        LocalDateTime fromTime = parseDateTime(from, true);
        LocalDateTime toTime = parseDateTime(to, false);
        Page<AdminOperationAuditLog> result = auditService.search(
                adminUserId,
                httpMethod,
                fromTime,
                toTime,
                PageRequest.of(Math.max(page, 0), safeSize));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", result.getContent().stream().map(this::toResponse).toList());
        body.put("total", result.getTotalElements());
        body.put("page", result.getNumber());
        body.put("size", result.getSize());
        body.put("totalPages", result.getTotalPages());
        return ResponseEntity.ok(body);
    }

    private LocalDateTime parseDateTime(String raw, boolean startOfDay) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String value = raw.trim();
        try {
            if (value.length() <= 10) {
                LocalDate date = LocalDate.parse(value);
                return startOfDay ? date.atStartOfDay() : date.atTime(LocalTime.MAX);
            }
            return LocalDateTime.parse(value);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Định dạng thời gian không hợp lệ: " + value);
        }
    }

    public static class VisitRequest {
        private String page;
        private String label;

        public String getPage() {
            return page;
        }

        public void setPage(String page) {
            this.page = page;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/audit-logs/visit")
    public ResponseEntity<Void> logPageVisit(@RequestBody VisitRequest body, HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long adminUserId = Long.parseLong(String.valueOf(auth.getPrincipal()));
        String page = body.getPage() == null ? "" : body.getPage().trim();
        String label = body.getLabel() == null || body.getLabel().isBlank()
                ? page
                : body.getLabel().trim();
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank()) {
            ip = ip.split(",")[0].trim();
        } else {
            ip = request.getRemoteAddr();
        }
        auditService.append(
                adminUserId,
                "XEM_TRANG: " + label,
                "trang_admin",
                page,
                "Admin mở trang: " + label,
                page,
                "VISIT",
                ip);
        return ResponseEntity.noContent().build();
    }

    private AdminOperationAuditLogResponse toResponse(AdminOperationAuditLog row) {
        AdminOperationAuditLogResponse response = new AdminOperationAuditLogResponse();
        response.setId(row.getId());
        response.setAdminUserId(row.getAdminUserId());
        response.setAction(row.getAction());
        response.setResourceType(row.getResourceType());
        response.setResourceId(row.getResourceId());
        response.setDetail(row.getDetail());
        response.setRequestPath(row.getRequestPath());
        response.setHttpMethod(row.getHttpMethod());
        response.setIpAddress(row.getIpAddress());
        response.setCreatedAt(row.getCreatedAt());
        return response;
    }
}
