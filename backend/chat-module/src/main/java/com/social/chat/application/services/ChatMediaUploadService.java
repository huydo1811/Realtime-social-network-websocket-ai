package com.social.chat.application.services;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.social.chat.domain.exceptions.InvalidMessageException;
import com.social.chat.presentation.dto.ChatUploadResponse;

@Service
public class ChatMediaUploadService {
    private static final long DEFAULT_MAX_BYTES = 25L * 1024 * 1024;
    private static final String ATTACHMENT_PREFIX = "[[chat-attachments]]";
    private static final Logger log = LoggerFactory.getLogger(ChatMediaUploadService.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String cloudName;
    private final String uploadPreset;
    private final String apiKey;
    private final String apiSecret;
    private final long maxFileBytes;

    public ChatMediaUploadService(
            ObjectMapper objectMapper,
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.upload-preset:}") String uploadPreset,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret,
            @Value("${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:}") String fallbackCloudName,
            @Value("${NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET:}") String fallbackUploadPreset,
            @Value("${CLOUDINARY_API_KEY:}") String fallbackApiKey,
            @Value("${CLOUDINARY_API_SECRET:}") String fallbackApiSecret,
            @Value("${chat.media.max-file-bytes:" + DEFAULT_MAX_BYTES + "}") long maxFileBytes) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
        this.cloudName = firstNonBlank(cloudName, fallbackCloudName);
        this.uploadPreset = firstNonBlank(uploadPreset, fallbackUploadPreset);
        this.apiKey = firstNonBlank(apiKey, fallbackApiKey);
        this.apiSecret = firstNonBlank(apiSecret, fallbackApiSecret);
        this.maxFileBytes = maxFileBytes > 0 ? maxFileBytes : DEFAULT_MAX_BYTES;
    }

    public ChatUploadResponse upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidMessageException("Vui lòng chọn tệp để upload");
        }
        if (file.getSize() > maxFileBytes) {
            throw new InvalidMessageException("Tệp vượt quá giới hạn " + (maxFileBytes / (1024 * 1024)) + "MB");
        }
        if (cloudName.isBlank() || uploadPreset.isBlank()) {
            throw new InvalidMessageException("Thiếu cấu hình Cloudinary ở backend");
        }

        try {
            String boundary = "----SocialBoundary" + UUID.randomUUID().toString().replace("-", "");
            byte[] payload = buildMultipartPayload(boundary, file);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.cloudinary.com/v1_1/" + cloudName + "/auto/upload"))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new InvalidMessageException(readCloudinaryError(response.body(), response.statusCode()));
            }

            JsonNode root = objectMapper.readTree(response.body());
            ChatUploadResponse dto = new ChatUploadResponse();
            dto.setUrl(root.path("secure_url").asText(""));
            dto.setResourceType(root.path("resource_type").asText(""));
            dto.setPublicId(root.path("public_id").asText(""));
            dto.setFormat(root.path("format").asText(""));
            dto.setOriginalFilename(root.path("original_filename").asText(file.getOriginalFilename()));
            dto.setBytes(root.path("bytes").asLong(file.getSize()));
            if (dto.getUrl() == null || dto.getUrl().isBlank()) {
                throw new InvalidMessageException("Cloudinary không trả về URL tệp");
            }
            return dto;
        } catch (InvalidMessageException e) {
            throw e;
        } catch (Exception e) {
            throw new InvalidMessageException("Không thể upload tệp lên Cloudinary: " + e.getMessage());
        }
    }

    public void deleteAssetsFromMessageContent(String messageContent) {
        List<AttachmentRef> refs = parseAttachmentRefs(messageContent);
        if (refs.isEmpty()) return;
        for (AttachmentRef ref : refs) {
            try {
                boolean deleted = deleteAsset(ref);
                if (!deleted) {
                    log.warn("Cloudinary asset was not deleted for url={} kind={}", ref.url(), ref.kind());
                }
            } catch (Exception e) {
                log.warn("Failed deleting Cloudinary asset url={} kind={}: {}", ref.url(), ref.kind(), e.getMessage());
            }
        }
    }

    public boolean deleteByUrl(String fileUrl, String kind) throws Exception {
        if (fileUrl == null || fileUrl.isBlank()) return true;
        if (cloudName.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            log.warn("Skip deleting Cloudinary asset due to missing api key/secret config");
            return false;
        }
        List<String> publicIdCandidates = extractPublicIdCandidates(fileUrl);
        if (publicIdCandidates.isEmpty()) return false;

        List<String> resourceCandidates = new ArrayList<>();
        String preferred = toCloudinaryResourceType(kind);
        resourceCandidates.add(preferred);
        if (!"image".equals(preferred)) resourceCandidates.add("image");
        if (!"video".equals(preferred)) resourceCandidates.add("video");
        if (!"raw".equals(preferred)) resourceCandidates.add("raw");

        for (String publicId : publicIdCandidates) {
            for (String resourceType : resourceCandidates) {
                boolean deleted = destroyByPublicId(publicId, resourceType);
                if (deleted) return true;
            }
        }
        return false;
    }

    private boolean deleteAsset(AttachmentRef ref) throws Exception {
        if (cloudName.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            log.warn("Skip deleting Cloudinary asset due to missing api key/secret config");
            return false;
        }
        if (ref.publicId() != null && !ref.publicId().isBlank()) {
            List<String> resourceCandidates = new ArrayList<>();
            String preferred = toCloudinaryResourceType(
                    ref.kind() != null && !ref.kind().isBlank() ? ref.kind() : ref.resourceType());
            resourceCandidates.add(preferred);
            if (!"image".equals(preferred)) resourceCandidates.add("image");
            if (!"video".equals(preferred)) resourceCandidates.add("video");
            if (!"raw".equals(preferred)) resourceCandidates.add("raw");
            for (String resourceType : resourceCandidates) {
                boolean deleted = destroyByPublicId(ref.publicId(), resourceType);
                if (deleted) return true;
            }
        }
        return deleteByUrl(ref.url(), ref.kind());
    }

    private boolean destroyByPublicId(String publicId, String resourceType) throws Exception {
        long timestamp = Instant.now().getEpochSecond();
        String toSign = "public_id=" + publicId + "&timestamp=" + timestamp + apiSecret;
        String signature = sha1Hex(toSign);
        String body = "public_id=" + urlEncode(publicId)
                + "&timestamp=" + timestamp
                + "&api_key=" + urlEncode(apiKey)
                + "&signature=" + urlEncode(signature);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.cloudinary.com/v1_1/" + cloudName + "/" + resourceType + "/destroy"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) return false;
        JsonNode root = objectMapper.readTree(response.body());
        String result = root.path("result").asText("");
        return "ok".equalsIgnoreCase(result) || "not found".equalsIgnoreCase(result);
    }

    private byte[] buildMultipartPayload(String boundary, MultipartFile file) throws IOException {
        String detectedContentType = file.getContentType();
        String detectedOriginalFilename = file.getOriginalFilename();
        String mimeType = detectedContentType == null || detectedContentType.isBlank()
                ? "application/octet-stream"
                : detectedContentType;
        String filename = detectedOriginalFilename == null || detectedOriginalFilename.isBlank()
                ? "upload.bin"
                : detectedOriginalFilename;
        byte[] fileBytes = file.getBytes();

        ByteArrayOutputStream output = new ByteArrayOutputStream();
        writeTextPart(output, boundary, "upload_preset", uploadPreset);

        output.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"\r\n")
                .getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Type: " + mimeType + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(fileBytes);
        output.write("\r\n".getBytes(StandardCharsets.UTF_8));
        output.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        return output.toByteArray();
    }

    private static void writeTextPart(ByteArrayOutputStream output, String boundary, String key, String value)
            throws IOException {
        output.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Disposition: form-data; name=\"" + key + "\"\r\n\r\n")
                .getBytes(StandardCharsets.UTF_8));
        output.write(value.getBytes(StandardCharsets.UTF_8));
        output.write("\r\n".getBytes(StandardCharsets.UTF_8));
    }

    private String readCloudinaryError(String body, int statusCode) {
        try {
            JsonNode node = objectMapper.readTree(body);
            String message = node.path("error").path("message").asText("");
            if (!message.isBlank()) return message + " (" + statusCode + ")";
        } catch (Exception ignored) {
        }
        return "Upload thất bại từ Cloudinary (" + statusCode + ")";
    }

    private List<AttachmentRef> parseAttachmentRefs(String content) {
        if (content == null || !content.startsWith(ATTACHMENT_PREFIX)) return List.of();
        String payload = content.substring(ATTACHMENT_PREFIX.length());
        int newlineIdx = payload.indexOf('\n');
        String json = newlineIdx >= 0 ? payload.substring(0, newlineIdx) : payload;
        if (json.isBlank()) return List.of();
        try {
            JsonNode node = objectMapper.readTree(json);
            if (!node.isArray()) return List.of();
            List<AttachmentRef> refs = new ArrayList<>();
            for (JsonNode item : node) {
                String url = item.path("url").asText("");
                String kind = item.path("kind").asText("file");
                String publicId = item.path("publicId").asText("");
                String resourceType = item.path("resourceType").asText("");
                if (!url.isBlank()) refs.add(new AttachmentRef(url, kind, publicId, resourceType));
            }
            return refs;
        } catch (Exception e) {
            log.warn("Cannot parse attachment metadata for cleanup: {}", e.getMessage());
            return List.of();
        }
    }

    private String toCloudinaryResourceType(String kind) {
        if ("image".equalsIgnoreCase(kind)) return "image";
        if ("video".equalsIgnoreCase(kind) || "audio".equalsIgnoreCase(kind)) return "video";
        return "raw";
    }

    private List<String> extractPublicIdCandidates(String fileUrl) {
        try {
            URI uri = URI.create(fileUrl);
            String path = URLDecoder.decode(uri.getPath(), StandardCharsets.UTF_8);
            String marker = "/upload/";
            int idx = path.lastIndexOf(marker);
            if (idx < 0) return List.of();
            String afterUpload = path.substring(idx + marker.length());
            String[] parts = afterUpload.split("/");
            int startIndex = 0;
            for (int i = 0; i < parts.length; i++) {
                if (parts[i].matches("v\\d+")) {
                    startIndex = i + 1;
                    break;
                }
            }
            if (startIndex >= parts.length) return List.of();
            StringBuilder sb = new StringBuilder();
            for (int i = startIndex; i < parts.length; i++) {
                if (parts[i].isBlank()) continue;
                if (sb.length() > 0) sb.append('/');
                sb.append(parts[i]);
            }
            String full = sb.toString();
            if (full.isBlank()) return List.of();
            int dot = full.lastIndexOf('.');
            if (dot > 0) {
                String withoutExt = full.substring(0, dot);
                if (!withoutExt.equals(full)) return List.of(full, withoutExt);
            }
            return List.of(full);
        } catch (Exception e) {
            return List.of();
        }
    }

    private static String urlEncode(String val) {
        return URLEncoder.encode(val, StandardCharsets.UTF_8);
    }

    private static String sha1Hex(String source) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-1");
        byte[] digest = md.digest(source.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private static String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) return first;
        if (second != null && !second.isBlank()) return second;
        return "";
    }

    private record AttachmentRef(String url, String kind, String publicId, String resourceType) {}
}
