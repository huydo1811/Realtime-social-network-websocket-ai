package com.social.post.application.usecases;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.ContentReport;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.ContentReportRepository;

@Service
public class ResolveContentReportUseCase {
    private final ContentReportRepository contentReportRepository;

    public ResolveContentReportUseCase(ContentReportRepository contentReportRepository) {
        this.contentReportRepository = contentReportRepository;
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ContentReport resolve(Long reportId, Long adminUserId, String note, boolean accept) {
        ContentReport report = contentReportRepository.findById(reportId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy báo cáo"));
        if (accept) report.resolve(adminUserId, note);
        else report.reject(adminUserId, note);
        return contentReportRepository.save(report);
    }
}
