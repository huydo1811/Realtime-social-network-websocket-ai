import type { ConversationResponse } from "@/types/chat";

/** Ẩn hội thoại riêng 1–1 chưa có tin khỏi danh sách / sidebar hiển thị */
export function shouldShowInThreadList(c: ConversationResponse): boolean {
  if (c.type === "GROUP") return true;
  if (c.type === "PRIVATE" && c.memberIds.length === 2) {
    return Boolean(c.lastMessageAt || c.lastMessageContent);
  }
  return true;
}
