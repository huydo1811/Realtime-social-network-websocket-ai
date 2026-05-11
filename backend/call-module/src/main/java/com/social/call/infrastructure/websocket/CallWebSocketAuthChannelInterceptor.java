package com.social.call.infrastructure.websocket;

import java.security.Principal;
import java.util.List;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import com.social.auth.infrastructure.security.JwtService;
import com.social.call.domain.constants.CallWebSocketDestinations;
import com.social.call.domain.exceptions.CallException;
import com.social.call.infrastructure.services.CallStateManager;

@Component
public class CallWebSocketAuthChannelInterceptor implements ChannelInterceptor {

    /**
     * Simple broker không luôn gắn lại {@link Principal} từ CONNECT sang SUBSCRIBE/SEND.
     * Lưu trong session WebSocket để khôi phục, tránh disconnect với "Unauthorized websocket message".
     */
    static final String SESSION_STOMP_PRINCIPAL = "com.social.call.stompPrincipal";

    private final JwtService jwtService;
    private final CallStateManager callStateManager;

    public CallWebSocketAuthChannelInterceptor(JwtService jwtService, CallStateManager callStateManager) {
        this.jwtService = jwtService;
        this.callStateManager = callStateManager;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        StompCommand command = accessor.getCommand();
        if (command == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(command)) {
            String token = resolveToken(accessor);
            if (token == null || !jwtService.validateToken(token)) {
                throw new CallException("Unauthorized websocket connection");
            }
            String userId = jwtService.getSubject(token);
            StompPrincipal stompPrincipal = new StompPrincipal(userId);
            accessor.setUser(stompPrincipal);
            if (accessor.getSessionAttributes() != null) {
                accessor.getSessionAttributes().put(SESSION_STOMP_PRINCIPAL, stompPrincipal);
            }
            callStateManager.registerUserSession(Long.parseLong(userId), accessor.getSessionId());
            return message;
        }

        restorePrincipalFromSessionIfMissing(accessor);
        authenticateFromBearerHeaderIfStillMissing(accessor);

        Principal principal = accessor.getUser();
        if (StompCommand.DISCONNECT.equals(command) && principal == null) {
            return message;
        }
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new CallException("Unauthorized websocket message");
        }

        if (StompCommand.SUBSCRIBE.equals(command)) {
            validateSubscription(accessor, principal.getName());
        }
        return message;
    }

    private void restorePrincipalFromSessionIfMissing(StompHeaderAccessor accessor) {
        if (accessor.getUser() != null) {
            return;
        }
        if (accessor.getSessionAttributes() == null) {
            return;
        }
        Object stored = accessor.getSessionAttributes().get(SESSION_STOMP_PRINCIPAL);
        if (stored instanceof Principal p) {
            accessor.setUser(p);
        }
    }

    /**
     * Một số client (SockJS + stomp.js) không đính kèm lại user từ CONNECT lên từng frame SEND;
     * header Authorization trên SEND/SUBSCRIBE vẫn có — dùng để gắn Principal cho handler.
     */
    private void authenticateFromBearerHeaderIfStillMissing(StompHeaderAccessor accessor) {
        if (accessor.getUser() != null) {
            return;
        }
        String token = resolveToken(accessor);
        if (token == null || !jwtService.validateToken(token)) {
            return;
        }
        String userId = jwtService.getSubject(token);
        StompPrincipal stompPrincipal = new StompPrincipal(userId);
        accessor.setUser(stompPrincipal);
        if (accessor.getSessionAttributes() != null) {
            accessor.getSessionAttributes().put(SESSION_STOMP_PRINCIPAL, stompPrincipal);
        }
    }

    private void validateSubscription(StompHeaderAccessor accessor, String principalUserId) {
        String destination = accessor.getDestination();
        if (destination == null || destination.isBlank()) {
            return;
        }
        String userPrefix = CallWebSocketDestinations.USER_TOPIC_PREFIX;
        if (!destination.startsWith(userPrefix)) {
            return;
        }
        String requestedUserId = destination.substring(userPrefix.length());
        if (!principalUserId.equals(requestedUserId)) {
            throw new CallException("Forbidden subscription destination");
        }
    }

    private String resolveToken(StompHeaderAccessor accessor) {
        List<String> authorization = accessor.getNativeHeader("Authorization");
        if (authorization == null || authorization.isEmpty()) {
            return null;
        }
        String value = authorization.getFirst();
        if (value == null || value.isBlank()) {
            return null;
        }
        if (value.startsWith("Bearer ")) {
            return value.substring(7).trim();
        }
        return value.trim();
    }
}
