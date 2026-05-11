package com.social.chat.infrastructure.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.social.chat.domain.entities.AdminChatAuditLog;

public interface JpaAdminChatAuditLogRepository extends JpaRepository<AdminChatAuditLog, Long> {
    Page<AdminChatAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
