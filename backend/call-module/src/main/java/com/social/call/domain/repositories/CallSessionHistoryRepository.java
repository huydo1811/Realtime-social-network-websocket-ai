package com.social.call.domain.repositories;

import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.social.call.domain.entities.CallSessionHistory;

public interface CallSessionHistoryRepository {
    CallSessionHistory save(CallSessionHistory history);

    Optional<CallSessionHistory> findByCallId(String callId);

    Page<CallSessionHistory> search(Long userId, String status, Pageable pageable);

    List<CallSessionHistory> findRecentByUserId(Long userId, int limit);
}
