import { getAuthTokens } from "./authToken";
import type { ProfileInfo } from "@/components/user/profile/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const searchUsers = async (query: string = '', page: number = 0, size: number = 10) => {
  const token = getAuthTokens()?.accessToken;
  
  const res = await fetch(`${API_URL}/users?fullName=${encodeURIComponent(query)}&page=${page}&size=${size}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[searchUsers] HTTP ${res.status} - ${res.statusText}`, errText);
    return { content: [] };
  }

  return res.json();
};

export const getUserById = async (userId: string): Promise<ProfileInfo> => {
  const token = getAuthTokens()?.accessToken;
  const res = await fetch(`${API_URL}/users/${userId}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error("User not found");
  return (await res.json()) as ProfileInfo;
};