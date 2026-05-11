package com.social.call.domain.entities;

public enum CallSessionState {
    INVITING,
    RINGING,
    CONNECTED,
    REJECTED,
    ENDED,
    TIMEOUT,
    CANCELED,
    BUSY
}
