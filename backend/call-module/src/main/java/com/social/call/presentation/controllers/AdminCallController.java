package com.social.call.presentation.controllers;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.call.domain.repositories.CallEventLogRepository;
import com.social.call.domain.repositories.CallSessionHistoryRepository;
import com.social.call.presentation.dto.AdminCallEventResponse;
import com.social.call.presentation.dto.AdminCallSessionResponse;
import com.social.call.presentation.mapper.AdminCallMapper;

@RestController
@RequestMapping("/calls/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCallController {
    private final CallSessionHistoryRepository callSessionHistoryRepository;
    private final CallEventLogRepository callEventLogRepository;
    private final AdminCallMapper adminCallMapper;

    public AdminCallController(
            CallSessionHistoryRepository callSessionHistoryRepository,
            CallEventLogRepository callEventLogRepository,
            AdminCallMapper adminCallMapper) {
        this.callSessionHistoryRepository = callSessionHistoryRepository;
        this.callEventLogRepository = callEventLogRepository;
        this.adminCallMapper = adminCallMapper;
    }

    @GetMapping("/sessions")
    public ResponseEntity<Page<AdminCallSessionResponse>> listSessions(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "userId", required = false) Long userId,
            @RequestParam(name = "status", required = false) String status) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(100, size));
        String normalizedStatus = status == null || status.isBlank() ? null : status.trim().toUpperCase();

        Page<AdminCallSessionResponse> dtoPage = callSessionHistoryRepository
                .search(userId, normalizedStatus, PageRequest.of(safePage, safeSize))
                .map(adminCallMapper::toSessionResponse);
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/users/{userId}/sessions")
    public ResponseEntity<List<AdminCallSessionResponse>> listUserRecentSessions(
            @PathVariable Long userId,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        List<AdminCallSessionResponse> rows = callSessionHistoryRepository.findRecentByUserId(userId, limit)
                .stream()
                .map(adminCallMapper::toSessionResponse)
                .toList();
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/sessions/{callId}/events")
    public ResponseEntity<List<AdminCallEventResponse>> listCallEvents(@PathVariable String callId) {
        List<AdminCallEventResponse> rows = callEventLogRepository.findByCallId(callId)
                .stream()
                .map(adminCallMapper::toEventResponse)
                .toList();
        return ResponseEntity.ok(rows);
    }
}
