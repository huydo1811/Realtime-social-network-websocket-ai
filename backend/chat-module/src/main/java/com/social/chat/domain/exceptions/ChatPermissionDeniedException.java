package com.social.chat.domain.exceptions;

public class ChatPermissionDeniedException extends ChatDomainException {
    public ChatPermissionDeniedException(String message) {
        super(message);
    }
}
