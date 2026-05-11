package com.social.call.domain.constants;

import java.util.Set;

public final class CallWebSocketEvents {

    public static final String CALL_INVITE = "CALL_INVITE";
    public static final String CALL_ACCEPT = "CALL_ACCEPT";
    public static final String CALL_REJECT = "CALL_REJECT";
    public static final String CALL_END = "CALL_END";
    public static final String CALL_CANCEL = "CALL_CANCEL";
    public static final String CALL_TIMEOUT = "CALL_TIMEOUT";
    public static final String CALL_BUSY = "CALL_BUSY";
    public static final String WEBRTC_OFFER = "WEBRTC_OFFER";
    public static final String WEBRTC_ANSWER = "WEBRTC_ANSWER";
    public static final String WEBRTC_ICE_CANDIDATE = "WEBRTC_ICE_CANDIDATE";
    public static final String USER_RINGING = "USER_RINGING";
    public static final String CALL_CONNECTED = "CALL_CONNECTED";
    public static final String CALL_RECONNECT = "CALL_RECONNECT";
    public static final String CALL_STATE_SYNC = "CALL_STATE_SYNC";
    public static final String CALL_ERROR = "CALL_ERROR";

    public static final Set<String> CLIENT_EVENTS = Set.of(
            CALL_INVITE,
            CALL_ACCEPT,
            CALL_REJECT,
            CALL_END,
            CALL_CANCEL,
            WEBRTC_OFFER,
            WEBRTC_ANSWER,
            WEBRTC_ICE_CANDIDATE,
            CALL_RECONNECT);

    private CallWebSocketEvents() {
    }
}
