package com.social.chat.application.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.domain.entities.AdminChatAuditLog;
import com.social.chat.infrastructure.repositories.JpaAdminChatAuditLogRepository;

@Service
public class AdminChatAuditService {

    private final JpaAdminChatAuditLogRepository repository;

    public AdminChatAuditService(JpaAdminChatAuditLogRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void record(
            Long adminUserId,
            String action,
            String reason,
            Long conversationId,
            Long messageId,
            String detail) {
        repository.save(AdminChatAuditLog.create(adminUserId, action, reason, conversationId, messageId, detail));
    }

    @Transactional(readOnly = true)
    public Page<AdminChatAuditLog> list(Pageable pageable) {
        return repository.findAllByOrderByCreatedAtDesc(pageable);
    }
}
