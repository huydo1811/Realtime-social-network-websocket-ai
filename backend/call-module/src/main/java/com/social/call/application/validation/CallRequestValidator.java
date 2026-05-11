package com.social.call.application.validation;

import org.springframework.stereotype.Component;

import com.social.call.application.dto.CallSignalRequest;
import com.social.call.domain.constants.CallWebSocketEvents;
import com.social.call.domain.exceptions.CallException;

@Component
public class CallRequestValidator {

    public void validate(CallSignalRequest request) {
        if (request == null) {
            throw new CallException("Request cannot be null");
        }
        if (!CallWebSocketEvents.CLIENT_EVENTS.contains(request.getEventType())) {
            throw new CallException("Unsupported eventType");
        }
        switch (request.getEventType()) {
            case CallWebSocketEvents.CALL_INVITE -> validateInvite(request);
            case CallWebSocketEvents.CALL_ACCEPT,
                    CallWebSocketEvents.CALL_REJECT,
                    CallWebSocketEvents.CALL_END,
                    CallWebSocketEvents.CALL_CANCEL,
                    CallWebSocketEvents.WEBRTC_OFFER,
                    CallWebSocketEvents.WEBRTC_ANSWER,
                    CallWebSocketEvents.WEBRTC_ICE_CANDIDATE,
                    CallWebSocketEvents.CALL_RECONNECT -> requireCallId(request);
            default -> throw new CallException("Unsupported eventType");
        }
    }

    private void validateInvite(CallSignalRequest request) {
        if (request.getTargetUserId() == null || request.getTargetUserId() <= 0) {
            throw new CallException("targetUserId is required for invite");
        }
        if (request.getMediaType() == null || request.getMediaType().isBlank()) {
            throw new CallException("mediaType is required for invite");
        }
    }

    private void requireCallId(CallSignalRequest request) {
        if (request.getCallId() == null || request.getCallId().isBlank()) {
            throw new CallException("callId is required");
        }
    }
}
