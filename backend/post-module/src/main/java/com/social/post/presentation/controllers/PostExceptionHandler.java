package com.social.post.presentation.controllers;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.exceptions.PostModerationRejectedException;

import jakarta.servlet.http.HttpServletRequest;

@ControllerAdvice(basePackageClasses = PostController.class)
public class PostExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<String> messages = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());
        return response(HttpStatus.BAD_REQUEST, "Validation Failed",
                messages.isEmpty() ? "Dữ liệu không hợp lệ" : messages.get(0), req.getRequestURI());
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class, PostDomainException.class})
    public ResponseEntity<?> handleBadRequest(RuntimeException ex, HttpServletRequest req) {
        return response(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(PostModerationRejectedException.class)
    public ResponseEntity<?> handleModerationReject(PostModerationRejectedException ex, HttpServletRequest req) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Content Moderation Rejected");
        body.put("message", ex.getMessage());
        body.put("path", req.getRequestURI());
        body.put("moderation", Map.of(
                "score", ex.getScore(),
                "model", ex.getModelName()
        ));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleOther(Exception ex, HttpServletRequest req) {
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "Đã xảy ra lỗi hệ thống", req.getRequestURI());
    }

    private ResponseEntity<?> response(HttpStatus status, String error, String message, String path) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        body.put("path", path);
        return ResponseEntity.status(status).body(body);
    }
}
