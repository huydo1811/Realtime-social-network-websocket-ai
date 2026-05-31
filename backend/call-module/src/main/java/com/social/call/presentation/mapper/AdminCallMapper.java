package com.social.call.presentation.mapper;

import org.springframework.stereotype.Component;

import com.social.call.domain.entities.CallEventLog;
import com.social.call.domain.entities.CallSessionHistory;
import com.social.call.presentation.dto.AdminCallEventResponse;
import com.social.call.presentation.dto.AdminCallSessionResponse;

@Component
public class AdminCallMapper {
    public AdminCallSessionResponse toSessionResponse(CallSessionHistory session) {
        AdminCallSessionResponse dto = new AdminCallSessionResponse();
        dto.setId(session.getId());
        dto.setCallId(session.getCallId());
        dto.setCallerId(session.getCallerId());
        dto.setCalleeId(session.getCalleeId());
        dto.setMediaType(session.getMediaType());
        dto.setStatus(session.getStatus());
        dto.setStartedAt(session.getStartedAt());
        dto.setAnsweredAt(session.getAnsweredAt());
        dto.setEndedAt(session.getEndedAt());
        dto.setEndReason(session.getEndReason());
        dto.setCreatedAt(session.getCreatedAt());
        return dto;
    }

    public AdminCallEventResponse toEventResponse(CallEventLog eventLog) {
        AdminCallEventResponse dto = new AdminCallEventResponse();
        dto.setId(eventLog.getId());
        dto.setCallId(eventLog.getCallId());
        dto.setEventType(eventLog.getEventType());
        dto.setActorId(eventLog.getActorId());
        dto.setPayload(eventLog.getPayload());
        dto.setOccurredAt(eventLog.getOccurredAt());
        return dto;
    }
}
