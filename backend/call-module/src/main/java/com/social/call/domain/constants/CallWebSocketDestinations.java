package com.social.call.domain.constants;

public final class CallWebSocketDestinations {

    public static final String APP_SIGNAL = "/app/call.signal";
    public static final String USER_TOPIC_PREFIX = "/topic/call/users/";
    public static final String SESSION_TOPIC_PREFIX = "/topic/call/sessions/";

    private CallWebSocketDestinations() {
    }
}
