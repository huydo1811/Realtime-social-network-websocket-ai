package com.social.auth.infrastructure.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.social.auth.domain.entities.AdminOperationAuditLog;

public interface JpaAdminOperationAuditLogRepository
        extends JpaRepository<AdminOperationAuditLog, Long>, JpaSpecificationExecutor<AdminOperationAuditLog> {

    Page<AdminOperationAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
