package com.social.call.infrastructure.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.call.domain.entities.CallSessionHistory;

public interface JpaCallSessionHistoryRepository extends JpaRepository<CallSessionHistory, Long> {
    Optional<CallSessionHistory> findByCallId(String callId);
}
