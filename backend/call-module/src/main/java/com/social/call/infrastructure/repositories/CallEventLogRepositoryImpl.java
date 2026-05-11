package com.social.call.infrastructure.repositories;

import org.springframework.stereotype.Repository;

import com.social.call.domain.entities.CallEventLog;
import com.social.call.domain.repositories.CallEventLogRepository;

@Repository
public class CallEventLogRepositoryImpl implements CallEventLogRepository {

    private final JpaCallEventLogRepository jpaRepository;

    public CallEventLogRepositoryImpl(JpaCallEventLogRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public CallEventLog save(CallEventLog eventLog) {
        return jpaRepository.save(eventLog);
    }
}
