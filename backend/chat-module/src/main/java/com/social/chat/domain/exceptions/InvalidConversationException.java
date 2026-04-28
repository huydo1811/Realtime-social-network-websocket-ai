package com.social.chat.domain.exceptions;

public class InvalidConversationException extends ChatDomainException {
    public InvalidConversationException(String message) {
        super(message);
    }
}
