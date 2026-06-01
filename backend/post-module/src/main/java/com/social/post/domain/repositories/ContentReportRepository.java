package com.social.post.domain.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.social.post.domain.entities.ContentReport;
import com.social.post.domain.entities.ContentReportStatus;

public interface ContentReportRepository {
    ContentReport save(ContentReport report);

    Page<ContentReport> findAll(Pageable pageable);

    Page<ContentReport> findByStatus(ContentReportStatus status, Pageable pageable);

    Optional<ContentReport> findById(Long id);
}
