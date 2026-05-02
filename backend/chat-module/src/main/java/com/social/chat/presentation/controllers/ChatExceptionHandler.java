package com.social.chat.presentation.controllers;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.social.chat.domain.exceptions.ChatPermissionDeniedException;
import com.social.chat.domain.exceptions.ConversationNotFoundException;
import com.social.chat.domain.exceptions.InvalidConversationException;
import com.social.chat.domain.exceptions.InvalidMessageException;
import com.social.chat.domain.exceptions.MessageNotFoundException;
import com.social.chat.domain.exceptions.UnauthorizedException;

import jakarta.servlet.http.HttpServletRequest;

@ControllerAdvice(basePackageClasses = ChatController.class)
public class ChatExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ChatExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<String> messages = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());

        return response(HttpStatus.BAD_REQUEST, "Validation Failed",
                messages.isEmpty() ? "Dữ liệu không hợp lệ" : messages.get(0), req.getRequestURI());
    }

    @ExceptionHandler({ InvalidConversationException.class, InvalidMessageException.class,
            IllegalArgumentException.class })
    public ResponseEntity<?> handleBadRequest(RuntimeException ex, HttpServletRequest req) {
        return response(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler({ ConversationNotFoundException.class, MessageNotFoundException.class })
    public ResponseEntity<?> handleNotFound(RuntimeException ex, HttpServletRequest req) {
        return response(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(ChatPermissionDeniedException.class)
    public ResponseEntity<?> handleForbidden(ChatPermissionDeniedException ex, HttpServletRequest req) {
        return response(HttpStatus.FORBIDDEN, "Forbidden", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<?> handleUnauthorized(UnauthorizedException ex, HttpServletRequest req) {
        return response(HttpStatus.UNAUTHORIZED, "Unauthorized", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, HttpServletRequest req) {
        return response(HttpStatus.BAD_REQUEST, "Bad Request", "Dữ liệu đầu vào không hợp lệ hoặc thiếu body", req.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleOther(Exception ex, HttpServletRequest req) {
        String errorId = UUID.randomUUID().toString();
        log.error("Unexpected chat error at {} - ErrorID: {}", req.getRequestURI(), errorId, ex);
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "Đã xảy ra lỗi hệ thống. Error ID: " + errorId, req.getRequestURI());
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
