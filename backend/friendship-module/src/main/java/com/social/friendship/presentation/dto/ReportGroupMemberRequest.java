package com.social.friendship.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReportGroupMemberRequest {
    private Long reportedUserId;

    @NotBlank(message = "Lý do báo cáo không được để trống")
    @Size(max = 1000, message = "Lý do báo cáo vượt quá 1000 ký tự")
    private String reason;

    public Long getReportedUserId() {
        return reportedUserId;
    }

    public void setReportedUserId(Long reportedUserId) {
        this.reportedUserId = reportedUserId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
