/**
 * Đọc subject (user id) từ JWT không verify — chỉ dùng cho subscribe realtime / routing UI.
 */
function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    const json = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getUserIdFromAccessToken(accessToken: string): number | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload || typeof payload.sub !== "string") return null;
  const id = Number(payload.sub);
  return Number.isFinite(id) && id > 0 ? id : null;
}
