package com.social.moderation.infrastructure.http;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.social.moderation.domain.ImageModerationResult;
import com.social.moderation.domain.ImageModerationService;
import com.social.moderation.infrastructure.config.ModerationProperties;

@Service
@ConditionalOnProperty(prefix = "moderation", name = "enabled", havingValue = "true", matchIfMissing = true)
public class HttpImageModerationService implements ImageModerationService {
    private static final Logger log = LoggerFactory.getLogger(HttpImageModerationService.class);

    private final RestTemplate restTemplate;
    private final ModerationProperties properties;
    private final ObjectMapper objectMapper;

    public HttpImageModerationService(ModerationProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        // Image path downloads remote bytes + runs EfficientNet — text timeouts are far too short.
        factory.setConnectTimeout(properties.getImageConnectTimeoutMs());
        factory.setReadTimeout(properties.getImageReadTimeoutMs());
        this.restTemplate = new RestTemplate(factory);
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public ImageModerationResult moderate(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return ImageModerationResult.fallback("empty_input", 0L);
        }
        String url = properties.getServiceUrl() + "/predict-image";
        long started = System.currentTimeMillis();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set(HttpHeaders.ACCEPT, "application/json");
            String safeUrl = imageUrl
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
            String body = "{\"imageUrl\":\"" + safeUrl + "\"}";
            HttpEntity<byte[]> request = new HttpEntity<>(body.getBytes(StandardCharsets.UTF_8), headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            String responseJson = response.getBody();
            if (responseJson == null || responseJson.isBlank()) {
                return ImageModerationResult.fallback("empty_body", System.currentTimeMillis() - started);
            }
            Map<String, Object> responseBody = parseJson(responseJson);
            if (responseBody == null) {
                return ImageModerationResult.fallback("bad_json", System.currentTimeMillis() - started);
            }
            boolean violation = Boolean.TRUE.equals(responseBody.get("violation"));
            double score = toDouble(responseBody.get("score"));
            double threshold = toDouble(responseBody.get("threshold"));
            String model = responseBody.get("model") instanceof String s ? s : "pet_filter_v1";
            String reason = responseBody.get("reason") instanceof String r ? r : "unknown";
            String predictedLabel = responseBody.get("predicted_label") instanceof String l ? l : "unknown";
            long inferenceMs = responseBody.get("inference_ms") instanceof Number n
                    ? n.longValue()
                    : Math.max(0L, System.currentTimeMillis() - started);
            return new ImageModerationResult(
                    violation,
                    score,
                    threshold <= 0 ? 1.0 : threshold,
                    model,
                    reason,
                    predictedLabel,
                    inferenceMs,
                    ImageModerationResult.Source.AI,
                    Instant.now()
            );
        } catch (RestClientException ex) {
            long elapsed = System.currentTimeMillis() - started;
            log.warn("Image moderation service unavailable, falling back ({}ms): {}", elapsed, ex.getMessage());
            return ImageModerationResult.fallback("service_unavailable:" + ex.getClass().getSimpleName(), elapsed);
        } catch (RuntimeException ex) {
            long elapsed = System.currentTimeMillis() - started;
            log.warn("Image moderation failed, falling back", ex);
            return ImageModerationResult.fallback("error:" + ex.getClass().getSimpleName(), elapsed);
        }
    }

    private static double toDouble(Object value) {
        if (value instanceof Number number) return number.doubleValue();
        if (value instanceof String s) {
            try {
                return Double.parseDouble(s);
            } catch (NumberFormatException ignored) {
                return 0.0;
            }
        }
        return 0.0;
    }

    private Map<String, Object> parseJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            return null;
        }
    }
}

