package com.social.chat.domain.exceptions;

public class ConversationNotFoundException extends ChatDomainException {
    public ConversationNotFoundException(Long conversationId) {
        super("Không tìm thấy conversation: " + conversationId);
    }
}
