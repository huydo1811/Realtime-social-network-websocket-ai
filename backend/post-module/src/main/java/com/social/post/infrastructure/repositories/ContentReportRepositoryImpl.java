package com.social.post.infrastructure.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.social.post.domain.entities.ContentReport;
import com.social.post.domain.entities.ContentReportStatus;
import com.social.post.domain.repositories.ContentReportRepository;

@Repository
public class ContentReportRepositoryImpl implements ContentReportRepository {
    private final JpaContentReportRepository jpaContentReportRepository;

    public ContentReportRepositoryImpl(JpaContentReportRepository jpaContentReportRepository) {
        this.jpaContentReportRepository = jpaContentReportRepository;
    }

    @Override
    public ContentReport save(ContentReport report) {
        return jpaContentReportRepository.save(report);
    }

    @Override
    public Page<ContentReport> findAll(Pageable pageable) {
        return jpaContentReportRepository.findAll(pageable);
    }

    @Override
    public Page<ContentReport> findByStatus(ContentReportStatus status, Pageable pageable) {
        return jpaContentReportRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    @Override
    public Optional<ContentReport> findById(Long id) {
        return jpaContentReportRepository.findById(id);
    }
}
