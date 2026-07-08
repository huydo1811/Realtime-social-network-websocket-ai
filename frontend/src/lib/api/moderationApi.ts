import { API_URL, apiAuthFetch } from "@/lib/api/userApi";

export type ModerationAudit = {
  id: number;
  targetType: "POST" | "COMMENT";
  targetId: number;
  authorUserId: number;
  contentHash: string;
  contentPreview: string | null;
  modelName: string;
  modelVersion: string;
  score: number;
  thresholdAllow: number | null;
  thresholdReject: number | null;
  source: "AI" | "FALLBACK";
  action: "ALLOW" | "SOFT_HIDE" | "HARD_REJECT" | "FALLBACK";
  inferenceMs: number;
  handled: boolean;
  handledAt: string | null;
  createdAt: string;
};

export type PagedModerationAudit = {
  items: ModerationAudit[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export const moderationApi = {
  async listAudit(
    page = 0,
    size = 20,
    minScore?: number,
    handled?: boolean
  ): Promise<PagedModerationAudit> {
    const qs = new URLSearchParams({ page: String(page), size: String(size) });
    if (minScore != null) qs.set("minScore", String(minScore));
    if (handled != null) qs.set("handled", String(handled));
    const res = await apiAuthFetch(`${API_URL}/admin/moderation/audit?${qs}`);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Không thể tải lịch sử moderation");
    }
    return (await res.json()) as PagedModerationAudit;
  },

  async markHandled(auditId: number): Promise<ModerationAudit> {
    const res = await apiAuthFetch(`${API_URL}/admin/moderation/audit/${auditId}/handled`, {
      method: "PATCH",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Không thể đánh dấu đã xử lý");
    }
    return (await res.json()) as ModerationAudit;
  },
};