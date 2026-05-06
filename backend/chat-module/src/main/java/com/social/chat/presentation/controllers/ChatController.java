package com.social.chat.presentation.controllers;

import java.util.List;
import java.util.Set;
import java.util.ArrayList;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

import com.social.chat.domain.exceptions.UnauthorizedException;
import com.social.chat.application.usecases.CreateConversationUseCase;
import com.social.chat.application.usecases.CountUnreadMessagesUseCase;
import com.social.chat.application.usecases.DeleteMessageUseCase;
import com.social.chat.application.usecases.EditMessageUseCase;
import com.social.chat.application.usecases.GetConversationDetailUseCase;
import com.social.chat.application.usecases.GetConversationMessagesUseCase;
import com.social.chat.application.usecases.ListMyConversationsUseCase;
import com.social.chat.application.usecases.SendMessageUseCase;
import com.social.chat.application.usecases.ToggleMessageStarUseCase;
import com.social.chat.application.usecases.PublishTypingStatusUseCase;
import com.social.chat.application.usecases.AddConversationMemberUseCase;
import com.social.chat.application.usecases.UpdateConversationAppearanceUseCase;
import com.social.chat.application.usecases.UpdatePresenceHeartbeatUseCase;
import com.social.chat.application.usecases.GetUserPresenceUseCase;
import com.social.chat.application.usecases.GetConversationReadStatusesUseCase;
import com.social.chat.domain.entities.ChatConversationReadStatus;
import com.social.chat.domain.repositories.ChatRoomUserSettingRepository;
import com.social.chat.presentation.dto.AddConversationMemberRequest;
import com.social.chat.presentation.dto.ConversationReadStatusResponse;
import com.social.chat.presentation.dto.ConversationResponse;
import com.social.chat.presentation.dto.CreateConversationRequest;
import com.social.chat.presentation.dto.EditMessageRequest;
import com.social.chat.presentation.dto.MessageResponse;
import com.social.chat.presentation.dto.PresenceHeartbeatRequest;
import com.social.chat.presentation.dto.SendMessageRequest;
import com.social.chat.presentation.dto.TypingStatusRequest;
import com.social.chat.presentation.dto.UpdateConversationAppearanceRequest;
import com.social.chat.presentation.dto.UserPresenceResponse;
import com.social.chat.presentation.mapper.ChatPresentationMapper;
import com.social.chat.application.usecases.MarkConversationReadUseCase;
import com.social.chat.application.services.ChatMediaUploadService;
import com.social.chat.presentation.dto.ChatUploadResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final CountUnreadMessagesUseCase countUnreadMessagesUseCase;
    private final ToggleMessageStarUseCase toggleMessageStarUseCase;
    private final PublishTypingStatusUseCase publishTypingStatusUseCase;
    private final UpdateConversationAppearanceUseCase updateConversationAppearanceUseCase;
    private final UpdatePresenceHeartbeatUseCase updatePresenceHeartbeatUseCase;
    private final GetUserPresenceUseCase getUserPresenceUseCase;
    private final GetConversationReadStatusesUseCase getConversationReadStatusesUseCase;
    private final ChatRoomUserSettingRepository roomUserSettingRepository;
    private final ChatPresentationMapper mapper;
    private final MarkConversationReadUseCase markConversationReadUseCase;
    private final ChatMediaUploadService chatMediaUploadService;
    private final ObjectMapper objectMapper;
    public ChatController(CreateConversationUseCase createConversationUseCase,
        ListMyConversationsUseCase listMyConversationsUseCase,
        GetConversationDetailUseCase getConversationDetailUseCase,
        GetConversationMessagesUseCase getConversationMessagesUseCase,
        SendMessageUseCase sendMessageUseCase,
        EditMessageUseCase editMessageUseCase,
        DeleteMessageUseCase deleteMessageUseCase,
        AddConversationMemberUseCase addConversationMemberUseCase,
        CountUnreadMessagesUseCase countUnreadMessagesUseCase,
        ToggleMessageStarUseCase toggleMessageStarUseCase,
        PublishTypingStatusUseCase publishTypingStatusUseCase,
        UpdateConversationAppearanceUseCase updateConversationAppearanceUseCase,
        UpdatePresenceHeartbeatUseCase updatePresenceHeartbeatUseCase,
        GetUserPresenceUseCase getUserPresenceUseCase,
        GetConversationReadStatusesUseCase getConversationReadStatusesUseCase,
        ChatRoomUserSettingRepository roomUserSettingRepository,
        MarkConversationReadUseCase markConversationReadUseCase,
        ChatMediaUploadService chatMediaUploadService,
        ObjectMapper objectMapper,
        ChatPresentationMapper mapper) {
    this.createConversationUseCase = createConversationUseCase;
    this.listMyConversationsUseCase = listMyConversationsUseCase;
    this.getConversationDetailUseCase = getConversationDetailUseCase;
    this.getConversationMessagesUseCase = getConversationMessagesUseCase;
    this.sendMessageUseCase = sendMessageUseCase;
    this.editMessageUseCase = editMessageUseCase;
    this.deleteMessageUseCase = deleteMessageUseCase;
    this.addConversationMemberUseCase = addConversationMemberUseCase;
    this.countUnreadMessagesUseCase = countUnreadMessagesUseCase;
    this.toggleMessageStarUseCase = toggleMessageStarUseCase;
    this.publishTypingStatusUseCase = publishTypingStatusUseCase;
    this.updateConversationAppearanceUseCase = updateConversationAppearanceUseCase;
    this.updatePresenceHeartbeatUseCase = updatePresenceHeartbeatUseCase;
    this.getUserPresenceUseCase = getUserPresenceUseCase;
    this.getConversationReadStatusesUseCase = getConversationReadStatusesUseCase;
    this.roomUserSettingRepository = roomUserSettingRepository;
    this.markConversationReadUseCase = markConversationReadUseCase;
    this.chatMediaUploadService = chatMediaUploadService;
    this.objectMapper = objectMapper;
    this.mapper = mapper;
}

    @PostMapping("/conversations")
    public ResponseEntity<ConversationResponse> createConversation(
            @Valid @RequestBody CreateConversationRequest request) {
        Long actorId = currentUserId();
        var conversation = createConversationUseCase.execute(actorId, request.getType(), request.getName(),
                request.getParticipantIds(), request.getIdempotencyKey());
        return ResponseEntity.ok(applyUserSetting(mapper.toConversationResponse(conversation), actorId));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> listConversations() {
        Long actorId = currentUserId();
        var conversations = listMyConversationsUseCase.execute(actorId);
        
        List<Long> conversationIds = conversations.stream().map(c -> c.getId()).toList();
        var unreadCounts = countUnreadMessagesUseCase.execute(conversationIds, actorId);

        java.util.Map<Long, com.social.chat.domain.entities.ChatRoomUserSetting> settingsByConversationId =
                roomUserSettingRepository.findByConversationIdsAndUserId(conversationIds, actorId).stream()
                        .collect(java.util.stream.Collectors.toMap(
                                com.social.chat.domain.entities.ChatRoomUserSetting::getConversationId,
                                s -> s));

        var response = conversations.stream().map(c -> {
            var res = mapper.toConversationResponse(c);
            res.setUnreadCount(unreadCounts.getOrDefault(c.getId(), 0));
            var setting = settingsByConversationId.get(c.getId());
            if (setting != null) {
                res.setNickname(setting.getNickname());
                res.setBubbleTheme(setting.getBubbleTheme());
                res.setBackgroundTheme(setting.getBackgroundTheme());
            }
            return res;
        }).toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ConversationResponse> getConversation(@PathVariable Long conversationId) {
        Long actorId = currentUserId();
        var conversation = getConversationDetailUseCase.execute(actorId, conversationId);
        return ResponseEntity.ok(applyUserSetting(mapper.toConversationResponse(conversation), actorId));
    }

    @PostMapping("/conversations/{conversationId}/members")
    public ResponseEntity<ConversationResponse> addMember(@PathVariable Long conversationId,
            @Valid @RequestBody AddConversationMemberRequest request) {
        Long actorId = currentUserId();
        var conversation = addConversationMemberUseCase.execute(actorId, conversationId, request.getMemberId());
        return ResponseEntity.ok(applyUserSetting(mapper.toConversationResponse(conversation), actorId));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(@PathVariable Long conversationId,
            @RequestParam(required = false) Long cursorId,
            @RequestParam(defaultValue = "20") int size) {
        Long actorId = currentUserId();
        Pageable pageable = PageRequest.of(0, Math.max(size, 1));
        var messages = getConversationMessagesUseCase.execute(actorId, conversationId, cursorId, pageable)
                .map(mapper::toMessageResponse)
                .getContent(); 
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(@PathVariable Long conversationId,
            @Valid @RequestBody SendMessageRequest request) {
        Long actorId = currentUserId();
        var message = sendMessageUseCase.execute(actorId, conversationId, request.getContent(),
                request.getIdempotencyKey(), request.getReplyToMessageId());
        return ResponseEntity.ok(mapper.toMessageResponse(message));
    }

    @PostMapping(value = "/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatUploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        currentUserId();
        return ResponseEntity.ok(chatMediaUploadService.upload(file));
    }

    @PostMapping(value = "/conversations/{conversationId}/messages/with-files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MessageResponse> sendMessageWithFiles(
            @PathVariable Long conversationId,
            @RequestParam(value = "content", required = false, defaultValue = "") String content,
            @RequestParam(value = "idempotencyKey", required = false) String idempotencyKey,
            @RequestParam(value = "replyToMessageId", required = false) Long replyToMessageId,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        Long actorId = currentUserId();
        String encodedContent = content;
        if (files != null && !files.isEmpty()) {
            List<Map<String, Object>> attachments = new ArrayList<>();
            for (MultipartFile file : files) {
                ChatUploadResponse uploaded = chatMediaUploadService.upload(file);
                attachments.add(Map.of(
                        "kind", mapAttachmentKind(file.getContentType(), file.getOriginalFilename(), uploaded.getResourceType()),
                        "url", uploaded.getUrl(),
                        "name", firstNonBlank(uploaded.getOriginalFilename(), file.getOriginalFilename(), "attachment"),
                        "mimeType", file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                        "size", uploaded.getBytes() != null ? uploaded.getBytes() : file.getSize(),
                        "publicId", uploaded.getPublicId() != null ? uploaded.getPublicId() : "",
                        "resourceType", uploaded.getResourceType() != null ? uploaded.getResourceType() : ""));
            }
            encodedContent = encodeContentWithAttachments(content, attachments);
        }
        var message = sendMessageUseCase.execute(actorId, conversationId, encodedContent, idempotencyKey, replyToMessageId);
        return ResponseEntity.ok(mapper.toMessageResponse(message));
    }

    @GetMapping("/downloads")
    public ResponseEntity<Map<String, String>> getDownloadUrl(@RequestParam("url") String url, @RequestParam(value = "name", required = false) String name) {
        currentUserId();
        String downloadUrl = toDownloadUrl(url, name);
        return ResponseEntity.ok(Map.of("url", downloadUrl));
    }

    private String mapAttachmentKind(String mimeType, String filename, String resourceType) {
        String safeMime = mimeType == null ? "" : mimeType.toLowerCase();
        if (safeMime.startsWith("image/")) return "image";
        if (safeMime.startsWith("video/")) return "video";
        if (safeMime.startsWith("audio/")) return "audio";

        String ext = "";
        if (filename != null && filename.contains(".")) {
            ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        }
        if (ext.matches("png|jpg|jpeg|gif|webp|bmp|svg")) return "image";
        if (ext.matches("mp4|mov|webm|mkv|m4v")) return "video";
        if (ext.matches("mp3|wav|ogg|m4a|aac")) return "audio";
        if (ext.matches("pdf|txt|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|csv|json|xml")) return "file";

        if (safeMime.isBlank() && ext.isBlank()) {
            if ("video".equalsIgnoreCase(resourceType)) return "video";
            if ("image".equalsIgnoreCase(resourceType)) return "image";
        }
        return "file";
    }

    private String encodeContentWithAttachments(String text, List<Map<String, Object>> attachments) {
        try {
            String payload = objectMapper.writeValueAsString(attachments);
            String normalizedText = text == null ? "" : text.trim();
            if (normalizedText.isEmpty()) return "[[chat-attachments]]" + payload;
            return "[[chat-attachments]]" + payload + "\n" + normalizedText;
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Không thể mã hóa metadata tệp đính kèm", e);
        }
    }

    private String toDownloadUrl(String url, String filename) {
        if (url == null || url.isBlank()) return url;
        try {
            java.net.URI uri = java.net.URI.create(url);
            String host = uri.getHost() == null ? "" : uri.getHost();
            if (!host.contains("res.cloudinary.com")) return url;
            String path = uri.getPath();
            String marker = "/upload/";
            int idx = path.lastIndexOf(marker);
            if (idx < 0) return url;
            String before = path.substring(0, idx + marker.length());
            String after = path.substring(idx + marker.length());
            String safeName = filename == null || filename.isBlank() ? "attachment" : filename;
            String transformedPath = before + "fl_attachment:" + java.net.URLEncoder.encode(safeName, java.nio.charset.StandardCharsets.UTF_8) + "/" + after;
            return uri.getScheme() + "://" + uri.getAuthority() + transformedPath;
        } catch (Exception e) {
            return url;
        }
    }

    private String firstNonBlank(String a, String b, String fallback) {
        if (a != null && !a.isBlank()) return a;
        if (b != null && !b.isBlank()) return b;
        return fallback;
    }

    @PostMapping("/messages/{messageId}/star")
    public ResponseEntity<MessageResponse> toggleMessageStar(@PathVariable Long messageId) {
        Long actorId = currentUserId();
        var message = toggleMessageStarUseCase.execute(actorId, messageId);
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
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác này");
        }
        try {
            return Long.parseLong(String.valueOf(auth.getPrincipal()));
        } catch (NumberFormatException e) {
            throw new UnauthorizedException("Token không hợp lệ hoặc đã hết hạn");
        }
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long conversationId) {
        Long actorId = currentUserId();
        markConversationReadUseCase.execute(conversationId, actorId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/conversations/{conversationId}/read-statuses")
    public ResponseEntity<List<ConversationReadStatusResponse>> getConversationReadStatuses(@PathVariable Long conversationId) {
        Long actorId = currentUserId();
        getConversationDetailUseCase.execute(actorId, conversationId);
        List<ConversationReadStatusResponse> response = getConversationReadStatusesUseCase.execute(conversationId).stream()
            .map(this::toConversationReadStatusResponse)
            .toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/conversations/{conversationId}/typing")
    public ResponseEntity<Void> publishTyping(@PathVariable Long conversationId,
                                              @RequestBody TypingStatusRequest request) {
        Long actorId = currentUserId();
        publishTypingStatusUseCase.execute(actorId, conversationId, request.isTyping());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/presence/heartbeat")
    public ResponseEntity<UserPresenceResponse> heartbeatPresence(@RequestBody PresenceHeartbeatRequest request) {
        Long actorId = currentUserId();
        var presence = updatePresenceHeartbeatUseCase.execute(actorId, request.isOnline());
        return ResponseEntity.ok(toUserPresenceResponse(presence.getUserId(), presence.getOnline(), presence.getLastSeenAt()));
    }

    @GetMapping("/presence")
    public ResponseEntity<List<UserPresenceResponse>> getPresence(@RequestParam List<Long> userIds) {
        currentUserId();
        Set<Long> requestedUserIds = userIds.stream().filter(id -> id != null && id > 0).collect(java.util.stream.Collectors.toSet());
        var statuses = getUserPresenceUseCase.execute(requestedUserIds);
        java.time.LocalDateTime threshold = java.time.LocalDateTime.now().minusSeconds(45);
        List<UserPresenceResponse> response = statuses.stream()
            .map(p -> {
                boolean online = Boolean.TRUE.equals(p.getOnline())
                        && p.getLastSeenAt() != null
                        && p.getLastSeenAt().isAfter(threshold);
                return toUserPresenceResponse(p.getUserId(), online, p.getLastSeenAt());
            }).toList();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/conversations/{conversationId}/appearance")
    public ResponseEntity<ConversationResponse> updateConversationAppearance(
            @PathVariable Long conversationId,
            @Valid @RequestBody UpdateConversationAppearanceRequest request) {
        Long actorId = currentUserId();
        var conversation = updateConversationAppearanceUseCase.execute(
                actorId,
                conversationId,
                request.getNickname(),
                request.getBubbleTheme(),
                request.getBackgroundTheme());
        return ResponseEntity.ok(applyUserSetting(mapper.toConversationResponse(conversation), actorId));
    }

    private ConversationReadStatusResponse toConversationReadStatusResponse(ChatConversationReadStatus status) {
        ConversationReadStatusResponse response = new ConversationReadStatusResponse();
        response.setUserId(status.getUserId());
        response.setLastReadMessageId(status.getLastReadMessageId());
        response.setReadAt(status.getReadAt());
        return response;
    }

    private UserPresenceResponse toUserPresenceResponse(Long userId, Boolean online, java.time.LocalDateTime lastSeenAt) {
        UserPresenceResponse response = new UserPresenceResponse();
        response.setUserId(userId);
        response.setOnline(Boolean.TRUE.equals(online));
        response.setLastSeenAt(lastSeenAt);
        return response;
    }

    private ConversationResponse applyUserSetting(ConversationResponse response, Long actorId) {
        roomUserSettingRepository.findByConversationIdAndUserId(response.getId(), actorId).ifPresent(setting -> {
            response.setNickname(setting.getNickname());
            response.setBubbleTheme(setting.getBubbleTheme());
            response.setBackgroundTheme(setting.getBackgroundTheme());
        });
        return response;
    }
}
