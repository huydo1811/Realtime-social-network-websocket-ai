package com.social.chat.presentation.mapper;

import org.springframework.stereotype.Component;

import com.social.chat.domain.entities.ChatConversation;
import com.social.chat.domain.entities.ChatMessage;
import com.social.chat.presentation.dto.ConversationResponse;
import com.social.chat.presentation.dto.MessageResponse;

@Component
public class ChatPresentationMapper {

    public ConversationResponse toConversationResponse(ChatConversation conversation) {
        ConversationResponse response = new ConversationResponse();
        response.setId(conversation.getId());
        response.setType(conversation.getType());
        response.setName(conversation.getName());
        response.setMemberIds(conversation.getMemberIds());
        response.setCreatedAt(conversation.getCreatedAt());
        return response;
    }

    public MessageResponse toMessageResponse(ChatMessage message) {
        MessageResponse response = new MessageResponse();
        response.setId(message.getId());
        response.setConversationId(message.getConversation().getId());
        response.setSenderId(message.getSenderId());
        response.setContent(message.getContent());
        response.setDeleted(message.isDeleted());
        response.setCreatedAt(message.getCreatedAt());
        response.setEditedAt(message.getEditedAt());
        response.setDeletedAt(message.getDeletedAt());
        response.setReplyToMessageId(message.getReplyToMessageId());
        response.setStarred(Boolean.TRUE.equals(message.getStarred()));
        return response;
    }
}
