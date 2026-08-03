package com.social.auth.application.services;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.auth.domain.entities.AdminOperationAuditLog;
import com.social.auth.infrastructure.repositories.JpaAdminOperationAuditLogRepository;

import jakarta.persistence.criteria.Predicate;

@Service
public class AdminOperationAuditService {

    private final JpaAdminOperationAuditLogRepository repository;

    public AdminOperationAuditService(JpaAdminOperationAuditLogRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void append(
            Long adminUserId,
            String action,
            String resourceType,
            String resourceId,
            String detail,
            String requestPath,
            String httpMethod,
            String ipAddress) {
        repository.save(AdminOperationAuditLog.create(
                adminUserId,
                action,
                resourceType,
                resourceId,
                detail,
                requestPath,
                httpMethod,
                ipAddress));
    }

    @Transactional(readOnly = true)
    public Page<AdminOperationAuditLog> list(Pageable pageable) {
        return repository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Transactional(readOnly = true)
    public Page<AdminOperationAuditLog> search(
            Long adminUserId,
            String httpMethod,
            LocalDateTime fromTime,
            LocalDateTime toTime,
            Pageable pageable) {
        String method = httpMethod == null || httpMethod.isBlank() || "ALL".equalsIgnoreCase(httpMethod)
                ? null
                : httpMethod.trim().toUpperCase();

        Specification<AdminOperationAuditLog> spec = (root, query, cb) -> {
            Predicate predicate = cb.conjunction();
            if (adminUserId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("adminUserId"), adminUserId));
            }
            if (method != null) {
                predicate = cb.and(predicate, cb.equal(cb.upper(root.get("httpMethod")), method));
            }
            if (fromTime != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("createdAt"), fromTime));
            }
            if (toTime != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("createdAt"), toTime));
            }
            if (query != null) {
                query.orderBy(cb.desc(root.get("createdAt")));
            }
            return predicate;
        };

        return repository.findAll(spec, pageable);
    }
}
