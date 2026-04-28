package com.social.chat.domain.exceptions;

public class MessageNotFoundException extends ChatDomainException {
    public MessageNotFoundException(Long messageId) {
        super("Không tìm thấy message: " + messageId);
    }
}