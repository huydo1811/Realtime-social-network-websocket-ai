package com.social.auth.infrastructure.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpRepository extends JpaRepository<OtpEntity, Long> {
    Optional<OtpEntity> findFirstByContactAndContactTypeAndPurposeAndUsedFalseOrderByCreatedAtDesc(
            String contact, String contactType, String purpose);

    Optional<OtpEntity> findFirstByContactAndContactTypeAndPurposeAndSessionUsedFalseOrderByVerifiedAtDesc(
            String contact, String contactType, String purpose);
}