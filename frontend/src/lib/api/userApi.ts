import { clearAuthTokens, getAuthTokens, saveAuthTokens } from "./authToken";
import type { ProfileInfo } from "@/components/user/profile/types";

function resolveApiBaseUrl(): string {
  const candidate = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
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

export const API_URL = resolveApiBaseUrl();

/**
 * Try to extract a user-friendly message from a non-2xx response.
 * Falls back to raw text or a generic default.
 */
export async function parseError(res: Response, defaultMessage: string): Promise<Error> {
  try {
    const text = await res.text();
    if (!text) return new Error(defaultMessage);
    try {
      const data = JSON.parse(text) as { message?: string; error?: string };
      if (data.message) return new Error(data.message);
      if (data.error) return new Error(data.error);
    } catch {
      // not JSON — fall through
    }
    return new Error(text || defaultMessage);
  } catch {
    return new Error(defaultMessage);
  }
}

export async function apiAuthFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const tokens = getAuthTokens();
  if (!tokens?.accessToken) throw new Error("Chưa đăng nhập");

  const withToken = (token: string) =>
    fetch(url, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${token}`,
      },
    });

  let res = await withToken(tokens.accessToken);
  if ((res.status === 401 || res.status === 403) && tokens.refreshToken) {
    try {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      if (!refreshRes.ok) {
        clearAuthTokens();
        return res;
      }
      const refreshed = (await refreshRes.json()) as {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType?: string;
      };
      saveAuthTokens(refreshed);
      res = await withToken(refreshed.accessToken);
    } catch {
      clearAuthTokens();
    }
  }
  return res;
}

export const searchUsers = async (query: string = '', page: number = 0, size: number = 10) => {
  const res = await apiAuthFetch(`${API_URL}/users?fullName=${encodeURIComponent(query)}&page=${page}&size=${size}`);

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[searchUsers] HTTP ${res.status} - ${res.statusText}`, errText);
    return { content: [] };
  }
  return res.json();
};

export const getUserById = async (userId: string): Promise<ProfileInfo> => {
  const res = await apiAuthFetch(`${API_URL}/users/${userId}`);
  if (!res.ok) throw new Error("Không tìm thấy người dùng");
  return (await res.json()) as ProfileInfo;
};

export const getMyProfile = async (): Promise<ProfileInfo> => {
  const res = await apiAuthFetch(`${API_URL}/users/me`);
  if (!res.ok) throw new Error("Không thể lấy thông tin cá nhân");
  return await res.json() as ProfileInfo;
};

export interface AdminUserDto {
  id?: number;
  email: string;
  fullName: string;
  username?: string;
  phone?: string;
  password?: string;
  role: string;
  isActive?: boolean;
  avatarUrl?: string;
}

export const adminGetUsers = async (
  page: number = 0,
  size: number = 10,
  query: string = "",
  isActive?: boolean
) => {
  let url = `${API_URL}/users?page=${page}&size=${size}`;
  const trimmed = query.trim();
  if (trimmed) {
    // q: email OR fullName OR username
    url += `&q=${encodeURIComponent(trimmed)}`;
  }
  if (isActive !== undefined) url += `&isActive=${isActive}`;

  const res = await apiAuthFetch(url);
  if (!res.ok) throw new Error("Gặp lỗi khi lấy danh sách user");
  return await res.json();
};

const cleanEmptyFields = (data: AdminUserDto) => {
  const payload = { ...data };
  if (!payload.password) delete payload.password;
  return payload;
};

const parseApiError = async (res: Response, defaultMessage: string) => {
  try {
    const err = await res.json();
    
    if (err.errors && Array.isArray(err.errors)) {

      const firstError = err.errors[0];
      const fieldName = firstError.field === 'email' ? 'Email' :
                        firstError.field === 'phone' ? 'Số điện thoại' :
                        firstError.field === 'password' ? 'Mật khẩu' :
                        firstError.field === 'fullName' ? 'Họ tên' : firstError.field;
                        
      return new Error(`Lỗi nhập liệu: ${fieldName} ${firstError.defaultMessage}`);
    }

    if (err.message) {
      const msg = err.message.toLowerCase();
      if (msg.includes("already exists") || msg.includes("duplicate")) {
        if (msg.includes("email")) return new Error("Email này đã có người sử dụng!");
        if (msg.includes("phone")) return new Error("Số điện thoại này đã có người sử dụng!");
        return new Error("Dữ liệu này đã tồn tại trong hệ thống!");
      }
      return new Error(err.message); 
    }
    
    return new Error(defaultMessage);
  } catch {
    return new Error(defaultMessage); 
  }
};

export const adminCreateUser = async (data: AdminUserDto) => {
  const res = await apiAuthFetch(`${API_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(cleanEmptyFields(data))
  });
  
  if (!res.ok) {
    throw await parseApiError(res, "Gặp sự cố khi tạo người dùng (Kiểm tra lại Email/SĐT)");
  }
  return await res.json();
};

export const adminUpdateUser = async (id: number, data: AdminUserDto) => {
  const res = await apiAuthFetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(cleanEmptyFields(data)) 
  });
  
  if (!res.ok) {
    throw await parseApiError(res, "Gặp sự cố khi cập nhật thông tin");
  }
  return await res.json();
};

export const adminDeleteUser = async (id: number) => {
  const res = await apiAuthFetch(`${API_URL}/users/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xoá người dùng thất bại!");
  return true;
};