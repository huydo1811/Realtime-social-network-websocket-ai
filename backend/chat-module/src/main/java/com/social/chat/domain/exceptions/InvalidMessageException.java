package com.social.chat.domain.exceptions;

public class InvalidMessageException extends ChatDomainException {
    public InvalidMessageException(String message) {
        super(message);
    }
}
