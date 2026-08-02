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

export type ModerationSettings = {
  textEnabled: boolean;
  imageEnabled: boolean;
  textAllowThreshold: number;
  textRejectThreshold: number;
  imageThreshold: number;
  updatedAt?: string | null;
};

export type ModerationModelVersion = {
  id: number;
  version: string;
  modelName: string;
  modelType: "TEXT" | "IMAGE";
  filePath: string;
  thresholdAllow: number;
  thresholdReject: number;
  active: boolean;
  createdAt?: string | null;
  activatedAt?: string | null;
};

export type AiServiceHealth = {
  reachable: boolean;
  status: string;
  textModelLoaded: boolean;
  imageModelLoaded: boolean;
  textModel?: string | null;
  imageModel?: string | null;
  imageThreshold?: number | null;
  detail?: string | null;
};

export type AiStatusResponse = {
  settings: ModerationSettings;
  activeTextModel: ModerationModelVersion | null;
  activeImageModel: ModerationModelVersion | null;
  aiService: AiServiceHealth;
};

async function parseError(res: Response, fallback: string): Promise<Error> {
  try {
    const data = (await res.json()) as { message?: string };
    if (data?.message) return new Error(data.message);
  } catch {
    // ignore
  }
  return new Error(fallback);
}

export const moderationApi = {
  async getStatus(): Promise<AiStatusResponse> {
    const res = await apiAuthFetch(`${API_URL}/admin/moderation/status`);
    if (!res.ok) throw await parseError(res, "Không thể tải trạng thái AI");
    return (await res.json()) as AiStatusResponse;
  },

  async getSettings(): Promise<ModerationSettings> {
    const res = await apiAuthFetch(`${API_URL}/admin/moderation/settings`);
    if (!res.ok) throw await parseError(res, "Không thể tải cấu hình AI");
    return (await res.json()) as ModerationSettings;
  },

  async updateSettings(payload: Partial<ModerationSettings>): Promise<ModerationSettings> {
    const res = await apiAuthFetch(`${API_URL}/admin/moderation/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res, "Không thể cập nhật cấu hình AI");
    return (await res.json()) as ModerationSettings;
  },

  async listModels(): Promise<ModerationModelVersion[]> {
    const res = await apiAuthFetch(`${API_URL}/admin/moderation/models`);
    if (!res.ok) throw await parseError(res, "Không thể tải danh sách mô hình");
    return (await res.json()) as ModerationModelVersion[];
  },

  async activateModel(modelId: number): Promise<ModerationModelVersion> {
    const res = await apiAuthFetch(`${API_URL}/admin/moderation/models/${modelId}/activate`, {
      method: "POST",
    });
    if (!res.ok) throw await parseError(res, "Không thể kích hoạt mô hình");
    return (await res.json()) as ModerationModelVersion;
  },

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
    if (!res.ok) throw await parseError(res, "Không thể tải lịch sử moderation");
    return (await res.json()) as PagedModerationAudit;
  },

  async markHandled(auditId: number): Promise<ModerationAudit> {
    const res = await apiAuthFetch(`${API_URL}/admin/moderation/audit/${auditId}/handled`, {
      method: "PATCH",
    });
    if (!res.ok) throw await parseError(res, "Không thể đánh dấu đã xử lý");
    return (await res.json()) as ModerationAudit;
  },
};
