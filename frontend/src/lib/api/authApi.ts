import { getAuthTokens, saveAuthTokens, clearAuthTokens } from "@/lib/api/authToken";

export type OtpPurpose = "REGISTER" | "LOGIN" | "RESET_PASSWORD";
export type ContactType = "EMAIL" | "PHONE";

export type AuthResponse = {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type VerifyOtpResponse = {
  otpSessionToken: string;
  expiresIn: number;
};

function resolveApiBaseUrl(): string {
  const candidate = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (candidate) {
    try {
      const parsed = new URL(candidate);
      if (
        typeof window !== "undefined" &&
        (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
      ) {
        parsed.hostname = window.location.hostname;
      }
      return parsed.toString().replace(/\/$/, "");
    } catch {
      return candidate;
    }
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }
  return "http://localhost:8080";
}

const API_BASE = resolveApiBaseUrl();

async function requestWithAuthRetry(
  path: string,
  method: "GET" | "PUT" | "POST",
  accessToken: string,
  body?: unknown
): Promise<Response> {
  const doFetch = (token: string) =>
    fetch(API_BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let res = await doFetch(accessToken);

  if (res.status === 401 || res.status === 403) {
    const tokens = getAuthTokens();
    if (!tokens?.refreshToken) {
      clearAuthTokens();
      return res;
    }

    try {
      const refreshed = await refreshToken(tokens.refreshToken);
      saveAuthTokens(refreshed);
      res = await doFetch(refreshed.accessToken);
    } catch {
      clearAuthTokens();
    }
  }

  return res;
}

async function extractError(res: Response, fallback: string): Promise<Error> {
  let text = "";
  try {
    text = await res.text();
  } catch {
    text = "";
  }
  const message = text || fallback;
  return new Error("HTTP_" + res.status + ": " + message);
}

async function postJson<T>(
  path: string,
  body: unknown,
  accessToken?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers.Authorization = "Bearer " + accessToken;
  }

  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const ct = res.headers.get("content-type") || "";
    let message = "Có lỗi xảy ra. Vui lòng thử lại.";

    try {
      if (ct.includes("application/json")) {
        const json = (await res.json()) as ApiErrorPayload;
        message = mapServerError(json);
      } else {
        const text = await res.text();
        message = mapServerError(text || undefined);
      }
    } catch {
      message = "Không thể kết nối máy chủ.";
    }

    throw new Error(message);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }

  return undefined as T;
}

async function getJson<T>(path: string, accessToken: string): Promise<T> {
  const res = await requestWithAuthRetry(path, "GET", accessToken);

  if (!res.ok) {
    throw await extractError(res, "Request failed");
  }

  return (await res.json()) as T;
}

type ApiErrorPayload = {
  error?: string;
  message?: string;
  status?: string;
};

function mapServerError(raw: ApiErrorPayload | string | undefined): string {
  if (!raw) return "Có lỗi xảy ra. Vui lòng thử lại.";

  const code =
    typeof raw === "string"
      ? raw
      : raw.error || raw.message || raw.status || "";

  const normalized = String(code).toUpperCase();

  if (normalized.includes("EMAIL_ALREADY_EXISTS")) return "Email này đã được đăng ký. Vui lòng đăng nhập.";
  if (normalized.includes("EMAIL_NOT_FOUND")) return "Email chưa được đăng ký. Vui lòng kiểm tra lại.";
  if (normalized.includes("INVALID_OR_EXPIRED")) return "Mã OTP không đúng hoặc đã hết hạn.";
  if (normalized.includes("UNABLE_TO_SEND")) return "Không gửi được OTP. Vui lòng thử lại.";
  if (normalized.includes("INVALID CREDENTIALS")) return "Email hoặc mật khẩu không đúng.";
  if (normalized.includes("UNAUTHORIZED")) return "Phiên đăng nhập không hợp lệ.";

  if (typeof raw === "string") return raw;
  if (raw.message) return raw.message;
  if (raw.error) return raw.error;
  return "Có lỗi xảy ra. Vui lòng thử lại.";
}

export async function requestOtp(
  contact: string,
  contactType: ContactType,
  purpose: OtpPurpose
) {
  return postJson<{ status: string }>("/auth/request-otp", {
    contact,
    contactType,
    purpose,
  });
}

export async function verifyOtp(
  contact: string,
  contactType: ContactType,
  code: string,
  purpose: OtpPurpose
) {
  return postJson<VerifyOtpResponse>("/auth/verify-otp", {
    contact,
    contactType,
    code,
    purpose,
  });
}

export async function loginWithOtpSession(
  email: string,
  password: string,
  otpSessionToken: string
) {
  return postJson<AuthResponse>("/auth/login", {
    email,
    password,
    otpSessionToken,
  });
}

export async function registerWithOtpSession(payload: {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  otpSessionToken: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
}) {
  return postJson("/auth/register", payload);
}

export async function refreshToken(refreshToken: string) {
  return postJson<AuthResponse>("/auth/refresh", { refreshToken });
}

export async function logout(refreshToken: string) {
  return postJson<void>("/auth/logout", { refreshToken });
}

export async function resetPasswordWithOtpSession(
  email: string,
  newPassword: string,
  otpSessionToken: string
) {
  return postJson("/auth/reset-password", {
    email,
    newPassword,
    otpSessionToken,
  });
}

export async function getMyProfile(accessToken: string) {
  return getJson("/users/me", accessToken);
}

export async function checkIsAdmin(email: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/auth/check-admin?email=${encodeURIComponent(email)}`);
  if (!res.ok) return false;
  return (await res.json()) as boolean;
}

export async function updateMyProfile(accessToken: string, payload: {
  username?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
}) {
  const res = await requestWithAuthRetry("/users/me", "PUT", accessToken, payload);

  if (!res.ok) {
    throw await extractError(res, "Không thể cập nhật hồ sơ");
  }

  return res.json();
}

export async function changePassword(accessToken: string, payload: {
  currentPassword?: string;
  newPassword?: string;
  otpSessionToken?: string;
}) {
  const res = await requestWithAuthRetry("/auth/change-password", "POST", accessToken, payload);

  if (!res.ok) {
    throw await extractError(res, "Không thể đổi mật khẩu");
  }

  return true;
}