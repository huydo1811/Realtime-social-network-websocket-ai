package com.social.post.infrastructure.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.social.post.domain.entities.ContentReport;
import com.social.post.domain.entities.ContentReportStatus;

public interface JpaContentReportRepository extends JpaRepository<ContentReport, Long> {
    Page<ContentReport> findByStatusOrderByCreatedAtDesc(ContentReportStatus status, Pageable pageable);
}
