package com.social.auth.infrastructure.security;

import java.io.IOException;
import java.util.Locale;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.social.auth.application.services.AdminOperationAuditService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Ghi nhật ký mọi thao tác của ADMIN (POST/PUT/PATCH/DELETE) trên toàn hệ thống
 * — không chỉ path /admin — và một số GET nhạy cảm.
 */
@Component
public class AdminOperationAuditFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AdminOperationAuditFilter.class);
    private static final Set<String> MUTATING_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final AdminOperationAuditService auditService;

    public AdminOperationAuditFilter(AdminOperationAuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        filterChain.doFilter(request, response);

        try {
            maybeAppendAudit(request, response);
        } catch (Exception ex) {
            log.warn("Failed to append admin operation audit log", ex);
        }
    }

    private void maybeAppendAudit(HttpServletRequest request, HttpServletResponse response) {
        String method = request.getMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return;
        }

        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!isAdmin) {
            return;
        }

        String path = request.getRequestURI();
        if (path == null) {
            return;
        }
        // Không log endpoint nhật ký (tránh vòng lặp / trùng)
        if (path.startsWith("/admin/audit-logs")) {
            return;
        }

        if (!shouldLog(method, path)) {
            return;
        }

        Long adminUserId;
        try {
            adminUserId = Long.parseLong(String.valueOf(auth.getPrincipal()));
        } catch (NumberFormatException ex) {
            log.debug("Skip admin audit: non-numeric principal {}", auth.getPrincipal());
            return;
        }

        ResourceHint hint = parseResourceHint(path);
        String statusVi = switch (response.getStatus()) {
            case 200, 201, 204 -> "Thành công";
            case 400 -> "Yêu cầu không hợp lệ";
            case 401, 403 -> "Không có quyền";
            case 404 -> "Không tìm thấy";
            default -> "Mã trạng thái " + response.getStatus();
        };
        String query = request.getQueryString();
        String detail = "Kết quả: " + statusVi + "; " + describeAction(method, path);
        if (query != null && !query.isBlank()) {
            detail = detail + "; tham số=" + truncate(query, 400);
        }

        String viAction = toVietnameseAction(method, path, hint.resourceType(), hint.resourceId());
        auditService.append(
                adminUserId,
                viAction,
                hint.resourceType(),
                hint.resourceId(),
                detail,
                truncate(path, 512),
                method,
                resolveClientIp(request));
    }

    private String toVietnameseAction(String method, String path, String resourceType, String resourceId) {
        String area = switch (resourceType == null ? "" : resourceType) {
            case "users", "user" -> "Người dùng";
            case "posts", "post" -> "Bài viết";
            case "reports", "report" -> "Báo cáo nội dung";
            case "pets", "pet" -> "Thú cưng";
            case "groups", "group" -> "Nhóm cộng đồng";
            case "friendships", "friendship", "follows" -> "Bạn bè";
            case "chat", "conversations", "messages" -> "Tin nhắn";
            case "calls", "call" -> "Cuộc gọi";
            case "moderation", "audit" -> "Quản lý AI";
            case "trang_admin" -> "Trang quản trị";
            default -> resourceType == null || resourceType.isBlank() ? "Hệ thống" : resourceType;
        };
        String verb = switch (method.toUpperCase(Locale.ROOT)) {
            case "POST" -> "Thêm / thực hiện";
            case "PUT", "PATCH" -> "Cập nhật";
            case "DELETE" -> "Xóa";
            case "GET" -> "Xem / truy xuất";
            case "VISIT" -> "Mở trang";
            default -> method;
        };
        String idPart = resourceId == null || resourceId.isBlank() ? "" : " (mã " + resourceId + ")";
        String statusHint = path.contains("hide") ? " — ẩn nội dung"
                : path.contains("resolve") ? " — duyệt báo cáo"
                : path.contains("reject") ? " — từ chối"
                : "";
        return verb + " " + area + idPart + statusHint;
    }

    private boolean shouldLog(String method, String path) {
        String upper = method.toUpperCase(Locale.ROOT);
        if (MUTATING_METHODS.contains(upper)) {
            return isAuditableAdminSurface(path);
        }
        if ("GET".equals(upper)) {
            return isSensitiveAdminGet(path);
        }
        return false;
    }

    /** Mọi API admin thao tác: users, posts, reports, pets, groups, chat, calls, friendship, moderation */
    private boolean isAuditableAdminSurface(String path) {
        if (path.startsWith("/admin") || path.contains("/admin/")) {
            return true;
        }
        if (path.startsWith("/users")) {
            return true;
        }
        if (path.startsWith("/posts")) {
            return true;
        }
        if (path.startsWith("/reports")) {
            return true;
        }
        if (path.startsWith("/pets")) {
            return true;
        }
        if (path.startsWith("/groups")) {
            return true;
        }
        if (path.startsWith("/friendships") || path.startsWith("/follows")) {
            return true;
        }
        if (path.startsWith("/chat") || path.startsWith("/conversations")) {
            return true;
        }
        if (path.startsWith("/calls") || path.startsWith("/call")) {
            return true;
        }
        if (path.startsWith("/moderation")) {
            return true;
        }
        return false;
    }

    private boolean isSensitiveAdminGet(String path) {
        if (path.startsWith("/admin/moderation")) {
            return true;
        }
        if (path.contains("/admin/conversations")) {
            return true;
        }
        if (path.contains("/chat/admin")) {
            return true;
        }
        return false;
    }

    private String describeAction(String method, String path) {
        String m = method.toUpperCase(Locale.ROOT);
        String area = "he_thong";
        if (path.startsWith("/users")) area = "nguoi_dung";
        else if (path.startsWith("/posts")) area = "bai_viet";
        else if (path.startsWith("/reports")) area = "bao_cao";
        else if (path.startsWith("/pets")) area = "thu_cung";
        else if (path.startsWith("/groups")) area = "nhom";
        else if (path.startsWith("/friendships") || path.startsWith("/follows")) area = "ban_be";
        else if (path.startsWith("/chat") || path.contains("/conversations")) area = "tin_nhan";
        else if (path.startsWith("/call")) area = "cuoc_goi";
        else if (path.contains("moderation") || path.startsWith("/admin/moderation")) area = "ai_kiem_duyet";
        else if (path.startsWith("/admin")) area = "admin_panel";

        String verb = switch (m) {
            case "POST" -> "tao_hoac_thao_tac";
            case "PUT", "PATCH" -> "cap_nhat";
            case "DELETE" -> "xoa";
            default -> m.toLowerCase(Locale.ROOT);
        };
        return area + ":" + verb;
    }

    private ResourceHint parseResourceHint(String path) {
        String[] segments = path.split("/");
        for (int i = 0; i < segments.length - 1; i++) {
            if (segments[i].isBlank()) continue;
            String next = segments[i + 1];
            if (next.matches("\\d+")) {
                return new ResourceHint(segments[i], next);
            }
        }
        if (path.startsWith("/admin/")) {
            String tail = path.substring("/admin/".length());
            int slash = tail.indexOf('/');
            String type = slash >= 0 ? tail.substring(0, slash) : tail;
            return new ResourceHint(type.isBlank() ? "admin" : type, null);
        }
        if (segments.length > 1 && !segments[1].isBlank()) {
            return new ResourceHint(segments[1], null);
        }
        return new ResourceHint(null, null);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return truncate(forwarded.split(",")[0].trim(), 64);
        }
        return truncate(request.getRemoteAddr(), 64);
    }

    private String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }

    private record ResourceHint(String resourceType, String resourceId) {}
}
