package com.social.moderation.presentation.controllers;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.social.moderation.application.services.ModerationRuntimeConfigService;
import com.social.moderation.domain.entities.ModerationAudit;
import com.social.moderation.domain.entities.ModerationModelVersion;
import com.social.moderation.domain.entities.ModerationModelVersion.ModelType;
import com.social.moderation.domain.entities.ModerationRuntimeSettings;
import com.social.moderation.domain.repositories.ModerationAuditRepository;
import com.social.moderation.domain.repositories.ModerationModelVersionRepository;
import com.social.moderation.infrastructure.config.ModerationProperties;
import com.social.moderation.presentation.dto.ModerationAdminDtos.AiServiceHealth;
import com.social.moderation.presentation.dto.ModerationAdminDtos.AiStatusResponse;
import com.social.moderation.presentation.dto.ModerationAdminDtos.ModelVersionResponse;
import com.social.moderation.presentation.dto.ModerationAdminDtos.SettingsResponse;
import com.social.moderation.presentation.dto.ModerationAdminDtos.UpdateSettingsRequest;
import com.social.moderation.presentation.dto.ModerationAuditResponse;
import com.social.moderation.presentation.dto.PagedResponse;

@RestController
@RequestMapping("/admin/moderation")
@PreAuthorize("hasRole('ADMIN')")
public class ModerationAdminController {

    private final ModerationAuditRepository auditRepository;
    private final ModerationModelVersionRepository modelVersionRepository;
    private final ModerationRuntimeConfigService runtimeConfig;
    private final ModerationProperties properties;
    private final RestTemplate restTemplate = new RestTemplate();

    public ModerationAdminController(
            ModerationAuditRepository auditRepository,
            ModerationModelVersionRepository modelVersionRepository,
            ModerationRuntimeConfigService runtimeConfig,
            ModerationProperties properties) {
        this.auditRepository = auditRepository;
        this.modelVersionRepository = modelVersionRepository;
        this.runtimeConfig = runtimeConfig;
        this.properties = properties;
    }

    @GetMapping("/status")
    public ResponseEntity<AiStatusResponse> status() {
        SettingsResponse settings = SettingsResponse.from(runtimeConfig.currentSettings());
        ModelVersionResponse textModel = modelVersionRepository.findByModelTypeAndActiveTrue(ModelType.TEXT)
                .map(ModelVersionResponse::from)
                .orElse(null);
        ModelVersionResponse imageModel = modelVersionRepository.findByModelTypeAndActiveTrue(ModelType.IMAGE)
                .map(ModelVersionResponse::from)
                .orElse(null);
        return ResponseEntity.ok(new AiStatusResponse(settings, textModel, imageModel, probeAiService()));
    }

    @GetMapping("/settings")
    public ResponseEntity<SettingsResponse> getSettings() {
        return ResponseEntity.ok(SettingsResponse.from(runtimeConfig.currentSettings()));
    }

    @PutMapping("/settings")
    public ResponseEntity<SettingsResponse> updateSettings(@RequestBody UpdateSettingsRequest request) {
        ModerationRuntimeSettings current = runtimeConfig.currentSettings();
        try {
            ModerationRuntimeSettings saved = runtimeConfig.updateSettings(
                    request.textEnabled() == null ? current.isTextEnabled() : request.textEnabled(),
                    request.imageEnabled() == null ? current.isImageEnabled() : request.imageEnabled(),
                    request.textAllowThreshold() == null ? current.getTextAllowThreshold() : request.textAllowThreshold(),
                    request.textRejectThreshold() == null ? current.getTextRejectThreshold() : request.textRejectThreshold(),
                    request.imageThreshold() == null ? current.getImageThreshold() : request.imageThreshold()
            );
            return ResponseEntity.ok(SettingsResponse.from(saved));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @GetMapping("/models")
    public ResponseEntity<List<ModelVersionResponse>> listModels() {
        return ResponseEntity.ok(modelVersionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(ModelVersionResponse::from)
                .toList());
    }

    @PostMapping("/models/{modelId}/activate")
    @Transactional
    public ResponseEntity<ModelVersionResponse> activateModel(@PathVariable Long modelId) {
        try {
            ModerationModelVersion activated = runtimeConfig.activateModel(modelId);
            return ResponseEntity.ok(ModelVersionResponse.from(activated));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    @GetMapping("/audit")
    public ResponseEntity<PagedResponse<ModerationAuditResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Double minScore,
            @RequestParam(required = false) Boolean handled) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(size, 1), 100);
        var pageable = PageRequest.of(safePage, safeSize);
        Page<ModerationAudit> paged;
        if (minScore == null && handled == null) {
            paged = auditRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else if (minScore != null && handled == null) {
            paged = auditRepository.findByScoreGreaterThanEqualOrderByCreatedAtDesc(minScore, pageable);
        } else if (minScore == null) {
            paged = auditRepository.findAllByHandledOrderByCreatedAtDesc(Boolean.TRUE.equals(handled), pageable);
        } else {
            paged = auditRepository.findByScoreGreaterThanEqualAndHandledOrderByCreatedAtDesc(
                    minScore,
                    Boolean.TRUE.equals(handled),
                    pageable
            );
        }
        return ResponseEntity.ok(new PagedResponse<>(
                paged.getContent().stream().map(ModerationAuditResponse::from).toList(),
                safePage,
                safeSize,
                paged.getTotalElements(),
                paged.getTotalPages(),
                paged.hasNext(),
                paged.hasPrevious()
        ));
    }

    @PatchMapping("/audit/{auditId}/handled")
    @Transactional
    public ResponseEntity<ModerationAuditResponse> markHandled(@PathVariable Long auditId) {
        Long safeAuditId = Objects.requireNonNull(auditId, "auditId");
        ModerationAudit audit = auditRepository.findById(safeAuditId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bản ghi moderation"));
        audit.markHandled();
        ModerationAudit saved = auditRepository.save(audit);
        return ResponseEntity.ok(ModerationAuditResponse.from(saved));
    }

    @SuppressWarnings("unchecked")
    private AiServiceHealth probeAiService() {
        try {
            Map<String, Object> body = restTemplate.getForObject(properties.getServiceUrl() + "/healthz", Map.class);
            if (body == null) {
                return new AiServiceHealth(false, "empty", false, false, null, null, null, "empty_health_body");
            }
            return new AiServiceHealth(
                    true,
                    body.get("status") instanceof String s ? s : "unknown",
                    Boolean.TRUE.equals(body.get("model_loaded")),
                    Boolean.TRUE.equals(body.get("image_model_loaded")),
                    body.get("model") instanceof String s ? s : null,
                    body.get("image_model") instanceof String s ? s : null,
                    body.get("image_threshold") instanceof Number n ? n.doubleValue() : null,
                    null
            );
        } catch (Exception ex) {
            return new AiServiceHealth(false, "unreachable", false, false, null, null, null, ex.getMessage());
        }
    }
}
