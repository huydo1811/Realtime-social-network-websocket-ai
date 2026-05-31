package com.social.call.infrastructure.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import com.social.call.domain.entities.CallEventLog;

public interface JpaCallEventLogRepository extends JpaRepository<CallEventLog, Long> {
    List<CallEventLog> findByCallIdOrderByOccurredAtAsc(String callId);
}
