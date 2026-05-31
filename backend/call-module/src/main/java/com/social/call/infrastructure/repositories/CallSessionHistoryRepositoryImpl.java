package com.social.call.infrastructure.repositories;

import java.util.Optional;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.social.call.domain.entities.CallSessionHistory;
import com.social.call.domain.repositories.CallSessionHistoryRepository;

@Repository
public class CallSessionHistoryRepositoryImpl implements CallSessionHistoryRepository {

    private final JpaCallSessionHistoryRepository jpaRepository;

    public CallSessionHistoryRepositoryImpl(JpaCallSessionHistoryRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public CallSessionHistory save(CallSessionHistory history) {
        return jpaRepository.save(history);
    }

    @Override
    public Optional<CallSessionHistory> findByCallId(String callId) {
        return jpaRepository.findByCallId(callId);
    }

    @Override
    public Page<CallSessionHistory> search(Long userId, String status, Pageable pageable) {
        return jpaRepository.search(userId, status, pageable);
    }

    @Override
    public List<CallSessionHistory> findRecentByUserId(Long userId, int limit) {
        int safeLimit = Math.max(1, Math.min(50, limit));
        return jpaRepository.findByUserId(userId, PageRequest.of(0, safeLimit));
    }
}
