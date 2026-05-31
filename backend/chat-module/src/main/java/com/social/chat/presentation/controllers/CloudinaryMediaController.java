package com.social.chat.presentation.controllers;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.social.chat.application.services.ChatMediaUploadService;

@RestController
@RequestMapping("/media/cloudinary")
public class CloudinaryMediaController {

    private final ChatMediaUploadService chatMediaUploadService;

    public CloudinaryMediaController(ChatMediaUploadService chatMediaUploadService) {
        this.chatMediaUploadService = chatMediaUploadService;
    }

    @PostMapping("/destroy")
    public ResponseEntity<Map<String, Object>> destroy(@RequestBody Map<String, String> body) {
        String url = body == null ? null : body.get("url");
        String kind = body == null ? null : body.get("kind");
        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("deleted", false, "message", "Thiếu url"));
        }
        try {
            boolean deleted = chatMediaUploadService.deleteByUrl(url.trim(), kind == null ? "image" : kind.trim());
            return ResponseEntity.ok(Map.of("deleted", deleted));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("deleted", false, "message", e.getMessage()));
        }
    }
}
