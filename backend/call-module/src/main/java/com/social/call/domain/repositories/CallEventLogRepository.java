package com.social.call.domain.repositories;

import com.social.call.domain.entities.CallEventLog;

public interface CallEventLogRepository {
    CallEventLog save(CallEventLog eventLog);
}
