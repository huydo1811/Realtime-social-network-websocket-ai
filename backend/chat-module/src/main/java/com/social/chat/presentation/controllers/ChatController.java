package com.social.chat.presentation.controllers;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.chat.application.usecases.CreateConversationUseCase;
import com.social.chat.application.usecases.DeleteMessageUseCase;
import com.social.chat.application.usecases.EditMessageUseCase;
import com.social.chat.application.usecases.GetConversationDetailUseCase;
import com.social.chat.application.usecases.GetConversationMessagesUseCase;
import com.social.chat.application.usecases.ListMyConversationsUseCase;
import com.social.chat.application.usecases.SendMessageUseCase;
import com.social.chat.application.usecases.AddConversationMemberUseCase;
import com.social.chat.presentation.dto.AddConversationMemberRequest;
import com.social.chat.presentation.dto.ConversationResponse;
import com.social.chat.presentation.dto.CreateConversationRequest;
import com.social.chat.presentation.dto.EditMessageRequest;
import com.social.chat.presentation.dto.MessageResponse;
import com.social.chat.presentation.dto.SendMessageRequest;
import com.social.chat.presentation.mapper.ChatPresentationMapper;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/chat")
public class ChatController {

    private final CreateConversationUseCase createConversationUseCase;
    private final ListMyConversationsUseCase listMyConversationsUseCase;
    private final GetConversationDetailUseCase getConversationDetailUseCase;
    private final GetConversationMessagesUseCase getConversationMessagesUseCase;
    private final SendMessageUseCase sendMessageUseCase;
    private final EditMessageUseCase editMessageUseCase;
    private final DeleteMessageUseCase deleteMessageUseCase;
    private final AddConversationMemberUseCase addConversationMemberUseCase;
    private final ChatPresentationMapper mapper;

    public ChatController(CreateConversationUseCase createConversationUseCase,
            ListMyConversationsUseCase listMyConversationsUseCase,
            GetConversationDetailUseCase getConversationDetailUseCase,
            GetConversationMessagesUseCase getConversationMessagesUseCase,
            SendMessageUseCase sendMessageUseCase,
            EditMessageUseCase editMessageUseCase,
            DeleteMessageUseCase deleteMessageUseCase,
            AddConversationMemberUseCase addConversationMemberUseCase,
            ChatPresentationMapper mapper) {
        this.createConversationUseCase = createConversationUseCase;
        this.listMyConversationsUseCase = listMyConversationsUseCase;
        this.getConversationDetailUseCase = getConversationDetailUseCase;
        this.getConversationMessagesUseCase = getConversationMessagesUseCase;
        this.sendMessageUseCase = sendMessageUseCase;
        this.editMessageUseCase = editMessageUseCase;
        this.deleteMessageUseCase = deleteMessageUseCase;
        this.addConversationMemberUseCase = addConversationMemberUseCase;
        this.mapper = mapper;
    }

    @PostMapping("/conversations")
    public ResponseEntity<ConversationResponse> createConversation(
            @Valid @RequestBody CreateConversationRequest request) {
        Long actorId = currentUserId();
        var conversation = createConversationUseCase.execute(actorId, request.getType(), request.getName(),
                request.getParticipantIds());
        return ResponseEntity.ok(mapper.toConversationResponse(conversation));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> listConversations() {
        Long actorId = currentUserId();
        var conversations = listMyConversationsUseCase.execute(actorId);
        var response = conversations.stream().map(mapper::toConversationResponse).toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ConversationResponse> getConversation(@PathVariable Long conversationId) {
        Long actorId = currentUserId();
        var conversation = getConversationDetailUseCase.execute(actorId, conversationId);
        return ResponseEntity.ok(mapper.toConversationResponse(conversation));
    }

    @PostMapping("/conversations/{conversationId}/members")
    public ResponseEntity<ConversationResponse> addMember(@PathVariable Long conversationId,
            @Valid @RequestBody AddConversationMemberRequest request) {
        Long actorId = currentUserId();
        var conversation = addConversationMemberUseCase.execute(actorId, conversationId, request.getMemberId());
        return ResponseEntity.ok(mapper.toConversationResponse(conversation));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Page<MessageResponse>> getMessages(@PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long actorId = currentUserId();
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        var messages = getConversationMessagesUseCase.execute(actorId, conversationId, pageable)
                .map(mapper::toMessageResponse);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(@PathVariable Long conversationId,
            @Valid @RequestBody SendMessageRequest request) {
        Long actorId = currentUserId();
        var message = sendMessageUseCase.execute(actorId, conversationId, request.getContent(),
                request.getIdempotencyKey());
        return ResponseEntity.ok(mapper.toMessageResponse(message));
    }

    @PutMapping("/messages/{messageId}")
    public ResponseEntity<MessageResponse> editMessage(@PathVariable Long messageId,
            @Valid @RequestBody EditMessageRequest request) {
        Long actorId = currentUserId();
        var message = editMessageUseCase.execute(actorId, messageId, request.getContent());
        return ResponseEntity.ok(mapper.toMessageResponse(message));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long messageId) {
        Long actorId = currentUserId();
        deleteMessageUseCase.execute(actorId, messageId);
        return ResponseEntity.noContent().build();
    }

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Unauthorized");
        }
        return Long.parseLong(String.valueOf(auth.getPrincipal()));
    }
}
