package com.social.call.domain.repositories;

import com.social.call.domain.entities.CallEventLog;
import java.util.List;

public interface CallEventLogRepository {
    CallEventLog save(CallEventLog eventLog);

    List<CallEventLog> findByCallId(String callId);
}
