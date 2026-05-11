package com.social.call.domain.repositories;

import java.util.Optional;

import com.social.call.domain.entities.CallSessionHistory;

public interface CallSessionHistoryRepository {
    CallSessionHistory save(CallSessionHistory history);

    Optional<CallSessionHistory> findByCallId(String callId);
}
