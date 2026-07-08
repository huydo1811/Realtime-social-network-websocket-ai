package com.social.moderation.infrastructure.http;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.social.moderation.domain.ModerationResult;
import com.social.moderation.domain.TextModerationService;
import com.social.moderation.infrastructure.config.ModerationProperties;

/**
 * Default {@link TextModerationService} implementation that talks to the
 * {@code ai-service} over HTTP.
 *
 * <p>This service is intentionally fail-open: any network or parsing error
 * produces a {@link ModerationResult#fallback(String, long)} so that business
 * flows never break because of the moderation subsystem.</p>
 */
@Service
public class HttpTextModerationService implements TextModerationService {

    private static final Logger log = LoggerFactory.getLogger(HttpTextModerationService.class);

    private final RestTemplate restTemplate;
    private final ModerationProperties properties;
    private final ObjectMapper objectMapper;

    public HttpTextModerationService(ModerationProperties properties) {
        this.properties = properties;
        // Use HttpURLConnection (plain HTTP/1.1). The default JDK HttpClient used by
        // RestTemplateBuilder attempts an h2c upgrade ("Upgrade: h2c") on http:// URLs,
        // which uvicorn rejects ("Unsupported upgrade request") and the request body
        // is lost — FastAPI then returns 422 "Field required".
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(properties.getConnectTimeoutMs());
        factory.setReadTimeout(properties.getReadTimeoutMs());
        this.restTemplate = new RestTemplate(factory);
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public ModerationResult moderate(String text) {
        if (text == null || text.isBlank()) {
            return ModerationResult.fallback("empty_input", 0L);
        }

        String url = properties.getServiceUrl() + "/predict";
        long started = System.currentTimeMillis();
        try {
            HttpHeaders headers = new HttpHeaders();
            // FastAPI / Pydantic is picky about Content-Type for request bodies: it
            // expects *exactly* "application/json" with no charset parameter, so use
            // a raw value here instead of MediaType.APPLICATION_JSON (which appends
            // ";charset=UTF-8" and causes 422).
            headers.set("Content-Type", "application/json");
            headers.set(HttpHeaders.ACCEPT, "application/json");

            // Build the JSON body manually as a String so the bytes are a clean
            // UTF-8 sequence. Going through a Map<Object,Object> + Jackson
            // converter occasionally serialises the body with the platform
            // default charset, which FastAPI rejects with 422 on Vietnamese
            // text containing diacritics.
            String safeText = text
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
            String body = "{\"text\":\"" + safeText + "\"}";
            byte[] bodyBytes = body.getBytes(StandardCharsets.UTF_8);
            log.info("[moderation] sending body bytes ({} bytes): {}", bodyBytes.length, body);
            HttpEntity<byte[]> request = new HttpEntity<>(bodyBytes, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    String.class
            );
            log.info("[moderation] response {}: {}", response.getStatusCode(), response.getBody());

            String responseJson = response.getBody();
            if (responseJson == null || responseJson.isBlank()) {
                long elapsed = System.currentTimeMillis() - started;
                log.warn("Empty moderation response body");
                return ModerationResult.fallback("empty_body", elapsed);
            }

            Map<String, Object> responseBody = parseJson(responseJson);
            if (responseBody == null) {
                long elapsed = System.currentTimeMillis() - started;
                log.warn("Failed to parse moderation response: {}", responseJson);
                return ModerationResult.fallback("bad_json", elapsed);
            }

            boolean violation = Boolean.TRUE.equals(responseBody.get("violation"));
            double score = toDouble(responseBody.get("score"));
            double threshold = toDouble(responseBody.get("threshold"));
            if (threshold <= 0.0) {
                threshold = properties.getRejectThreshold();
            }
            String model = responseBody.get("model") instanceof String s
                    ? s
                    : properties.getDefaultModelName();
            String reason = responseBody.get("reason") instanceof String r ? r : "unknown";

            long elapsed = System.currentTimeMillis() - started;
            return new ModerationResult(
                    violation, score, threshold, model, reason,
                    elapsed, ModerationResult.Source.AI, java.time.Instant.now()
            );
        } catch (RestClientException ex) {
            long elapsed = System.currentTimeMillis() - started;
            log.warn("Moderation service unavailable, falling back ({}ms): {}", elapsed, ex.getMessage());
            return ModerationResult.fallback("service_unavailable:" + ex.getClass().getSimpleName(), elapsed);
        } catch (RuntimeException ex) {
            long elapsed = System.currentTimeMillis() - started;
            log.warn("Moderation call failed, falling back", ex);
            return ModerationResult.fallback("error:" + ex.getClass().getSimpleName(), elapsed);
        }
    }

    private static double toDouble(Object value) {
        if (value instanceof Number number) return number.doubleValue();
        if (value instanceof String s) {
            try { return Double.parseDouble(s); } catch (NumberFormatException ignored) { return 0.0; }
        }
        return 0.0;
    }

    private Map<String, Object> parseJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.debug("JSON parse failed: {}", ex.getMessage());
            return null;
        }
    }
}