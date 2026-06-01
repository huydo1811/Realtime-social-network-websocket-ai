package com.social.post.application.usecases;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.ContentReport;
import com.social.post.domain.entities.ContentReportStatus;
import com.social.post.domain.repositories.ContentReportRepository;

@Service
public class ListContentReportsUseCase {
    private final ContentReportRepository contentReportRepository;

    public ListContentReportsUseCase(ContentReportRepository contentReportRepository) {
        this.contentReportRepository = contentReportRepository;
    }

    @Transactional(readOnly = true)
    public Page<ContentReport> execute(String status, Pageable pageable) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return contentReportRepository.findAll(pageable);
        }
        ContentReportStatus parsed = ContentReportStatus.valueOf(status.trim().toUpperCase());
        return contentReportRepository.findByStatus(parsed, pageable);
    }
}
