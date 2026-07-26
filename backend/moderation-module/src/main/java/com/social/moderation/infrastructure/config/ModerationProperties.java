package com.social.moderation.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for the moderation module.
 *
 * <pre>
 * moderation.enabled=true
 * moderation.service-url=http://localhost:8000
 * moderation.connect-timeout-ms=200
 * moderation.read-timeout-ms=300
 * moderation.image-connect-timeout-ms=2000
 * moderation.image-read-timeout-ms=30000
 * moderation.image-fail-open=false
 * moderation.allow-threshold=0.50
 * moderation.reject-threshold=0.85
 * </pre>
 */
@ConfigurationProperties(prefix = "moderation")
public class ModerationProperties {

    private boolean enabled = true;
    private String serviceUrl = "http://localhost:8000";
    private int connectTimeoutMs = 200;
    private int readTimeoutMs = 300;
    /** Image moderation downloads remote media + runs CNN — needs a much larger budget than text. */
    private int imageConnectTimeoutMs = 2000;
    private int imageReadTimeoutMs = 30000;
    /**
     * When false (default), image moderation timeouts/errors reject the post instead of
     * silently allowing non-pet images through.
     */
    private boolean imageFailOpen = false;
    private double allowThreshold = 0.50;
    private double rejectThreshold = 0.85;
    private String defaultModelName = "phobert_v1";

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getServiceUrl() { return serviceUrl; }
    public void setServiceUrl(String serviceUrl) { this.serviceUrl = serviceUrl; }

    public int getConnectTimeoutMs() { return connectTimeoutMs; }
    public void setConnectTimeoutMs(int connectTimeoutMs) { this.connectTimeoutMs = connectTimeoutMs; }

    public int getReadTimeoutMs() { return readTimeoutMs; }
    public void setReadTimeoutMs(int readTimeoutMs) { this.readTimeoutMs = readTimeoutMs; }

    public int getImageConnectTimeoutMs() { return imageConnectTimeoutMs; }
    public void setImageConnectTimeoutMs(int imageConnectTimeoutMs) {
        this.imageConnectTimeoutMs = imageConnectTimeoutMs;
    }

    public int getImageReadTimeoutMs() { return imageReadTimeoutMs; }
    public void setImageReadTimeoutMs(int imageReadTimeoutMs) {
        this.imageReadTimeoutMs = imageReadTimeoutMs;
    }

    public boolean isImageFailOpen() { return imageFailOpen; }
    public void setImageFailOpen(boolean imageFailOpen) { this.imageFailOpen = imageFailOpen; }

    public double getAllowThreshold() { return allowThreshold; }
    public void setAllowThreshold(double allowThreshold) { this.allowThreshold = allowThreshold; }

    public double getRejectThreshold() { return rejectThreshold; }
    public void setRejectThreshold(double rejectThreshold) { this.rejectThreshold = rejectThreshold; }

    public String getDefaultModelName() { return defaultModelName; }
    public void setDefaultModelName(String defaultModelName) { this.defaultModelName = defaultModelName; }
}