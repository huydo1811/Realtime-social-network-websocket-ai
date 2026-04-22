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

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

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
  const res = await fetch(API_BASE + path, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  if (!res.ok) {
    let msg = "Request failed";
    try {
      msg = (await res.text()) || msg;
    } catch {
      msg = "Request failed";
    }
    throw new Error(msg);
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
  // Đổi API_URL thành API_BASE
  const res = await fetch(`${API_BASE}/auth/check-admin?email=${encodeURIComponent(email)}`);
  if (!res.ok) return false;
  return res.json(); 
}