package com.social.auth.domain.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "admin_operation_audit_logs")
public class AdminOperationAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_user_id", nullable = false)
    private Long adminUserId;

    @Column(name = "action", nullable = false, length = 128)
    private String action;

    @Column(name = "resource_type", length = 64)
    private String resourceType;

    @Column(name = "resource_id", length = 64)
    private String resourceId;

    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

    @Column(name = "request_path", length = 512)
    private String requestPath;

    @Column(name = "http_method", length = 16)
    private String httpMethod;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static AdminOperationAuditLog create(
            Long adminUserId,
            String action,
            String resourceType,
            String resourceId,
            String detail,
            String requestPath,
            String httpMethod,
            String ipAddress) {
        AdminOperationAuditLog row = new AdminOperationAuditLog();
        row.adminUserId = adminUserId;
        row.action = action;
        row.resourceType = blankToNull(resourceType);
        row.resourceId = blankToNull(resourceId);
        row.detail = blankToNull(detail);
        row.requestPath = blankToNull(requestPath);
        row.httpMethod = blankToNull(httpMethod);
        row.ipAddress = blankToNull(ipAddress);
        return row;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Long getAdminUserId() {
        return adminUserId;
    }

    public String getAction() {
        return action;
    }

    public String getResourceType() {
        return resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public String getDetail() {
        return detail;
    }

    public String getRequestPath() {
        return requestPath;
    }

    public String getHttpMethod() {
        return httpMethod;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
