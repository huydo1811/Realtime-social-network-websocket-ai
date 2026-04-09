package com.social.auth.infrastructure.persistence;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OtpRepository extends JpaRepository<OtpEntity, Long> {

    Optional<OtpEntity> findFirstByContactAndContactTypeAndPurposeAndUsedFalseOrderByCreatedAtDesc(
            String contact, String contactType, String purpose);

    Optional<OtpEntity> findFirstByContactAndContactTypeAndPurposeAndSessionUsedFalseOrderByVerifiedAtDesc(
            String contact, String contactType, String purpose);

    @Modifying
    @Query("""
    update OtpEntity o
    set o.used = true, o.sessionUsed = true
    where o.contact = :contact
      and o.contactType = :contactType
      and o.purpose = :purpose
      and (o.used = false or o.sessionUsed = false)
    """)
    int invalidateActiveOtps(@Param("contact") String contact,
                             @Param("contactType") String contactType,
                             @Param("purpose") String purpose);

    @Modifying
    @Query("""
    delete from OtpEntity o
    where o.createdAt < :hardDeleteBefore
       or (o.used = true and o.createdAt < :usedDeleteBefore)
       or o.expiresAt < :now
       or (o.sessionExpiresAt is not null and o.sessionExpiresAt < :now)
    """)
    int cleanupExpiredAndOld(@Param("now") LocalDateTime now,
                             @Param("usedDeleteBefore") LocalDateTime usedDeleteBefore,
                             @Param("hardDeleteBefore") LocalDateTime hardDeleteBefore);
}