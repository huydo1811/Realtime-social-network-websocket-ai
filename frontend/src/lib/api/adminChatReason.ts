const STORAGE_KEY = "hype_admin_chat_access_reason";

export function setAdminChatAccessReason(reason: string): void {
  if (typeof window === "undefined") return;
  const t = reason.trim();
  if (t) sessionStorage.setItem(STORAGE_KEY, t);
  else sessionStorage.removeItem(STORAGE_KEY);
}

export function getAdminChatAccessReason(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(STORAGE_KEY)?.trim() || "";
}
