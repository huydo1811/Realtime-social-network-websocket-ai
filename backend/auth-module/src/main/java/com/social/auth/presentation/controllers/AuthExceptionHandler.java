package com.social.auth.presentation.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;

@ControllerAdvice
public class AuthExceptionHandler {

    // Bắt lỗi Validation của DTO (như độ dài mật khẩu v.v.)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<String> errors = ex.getBindingResult().getFieldErrors()
            .stream()
            .map(fe -> fe.getDefaultMessage()) 
            .collect(Collectors.toList());
            
        Map<String,Object> body = new HashMap<>();
        body.put("status", 400);
        body.put("error", "Validation Failed");
        body.put("message", errors.isEmpty() ? "Dữ liệu không hợp lệ" : errors.get(0));
        body.put("path", req.getRequestURI());
        
        return ResponseEntity.badRequest().body(body);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest req) {
        Map<String,Object> body = new HashMap<>();
        body.put("status", 400); 
        body.put("error", "Bad Request");
        body.put("message", ex.getMessage()); 
        body.put("path", req.getRequestURI());
        
        return ResponseEntity.badRequest().body(body);
    }
}
