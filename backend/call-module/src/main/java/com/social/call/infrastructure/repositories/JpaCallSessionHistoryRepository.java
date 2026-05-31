package com.social.call.infrastructure.repositories;

import java.util.Optional;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.call.domain.entities.CallSessionHistory;

public interface JpaCallSessionHistoryRepository extends JpaRepository<CallSessionHistory, Long> {
    Optional<CallSessionHistory> findByCallId(String callId);

    @Query("""
            SELECT c FROM CallSessionHistory c
            WHERE (:userId IS NULL OR c.callerId = :userId OR c.calleeId = :userId)
              AND (:status IS NULL OR c.status = :status)
            ORDER BY c.createdAt DESC
            """)
    Page<CallSessionHistory> search(@Param("userId") Long userId, @Param("status") String status, Pageable pageable);

    @Query("""
            SELECT c FROM CallSessionHistory c
            WHERE c.callerId = :userId OR c.calleeId = :userId
            ORDER BY c.createdAt DESC
            """)
    List<CallSessionHistory> findByUserId(@Param("userId") Long userId, Pageable pageable);
}
