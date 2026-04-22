type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  savedAt: number;
};

const KEY = "auth_tokens";

export function saveAuthTokens(data: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType?: string;
}) {
  if (typeof window === "undefined") return;
  const payload: StoredAuth = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
    tokenType: data.tokenType || "Bearer",
    savedAt: Date.now(),
  };
  localStorage.setItem(KEY, JSON.stringify(payload));
}

export function getAuthTokens(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}