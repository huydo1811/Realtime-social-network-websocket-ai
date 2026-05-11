package com.social.call.infrastructure.repositories;

import java.util.Optional;

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
}
