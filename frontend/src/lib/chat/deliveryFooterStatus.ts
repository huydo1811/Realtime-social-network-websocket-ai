import type {
  ConversationReadStatusResponse,
  ConversationResponse,
  MessageResponse,
  UserPresenceResponse,
} from "@/types/chat";

export type DeliveryFooterLine = { statusLabel: string; readByLabel: string };

/** Trạng thái tin của mình (Messenger-style) — dùng chung ChatWindow + FloatingChatWindow */
export function computeDeliveryFooterForMessage(
  message: MessageResponse,
  opts: {
    currentUserId: number;
    conversation: Pick<ConversationResponse, "type" | "memberIds">;
    readStatuses: ConversationReadStatusResponse[];
    presenceMap: Record<number, UserPresenceResponse>;
    userNames: Record<number, string>;
  }
): DeliveryFooterLine {
  const { currentUserId, conversation, readStatuses, presenceMap, userNames } = opts;
  if (message.senderId !== currentUserId) return { statusLabel: "", readByLabel: "" };

  const peerStatuses = readStatuses.filter((s) => s.userId !== currentUserId);
  const readers = peerStatuses.filter((s) => (s.lastReadMessageId ?? -1) >= message.id);
  if (readers.length > 0) {
    if (conversation.type === "GROUP") {
      const names = readers
        .slice(0, 2)
        .map((r) => userNames[r.userId] || `#${r.userId}`)
        .join(", ");
      return {
        statusLabel: "Đã xem",
        readByLabel: `bởi ${names}${readers.length > 2 ? ` +${readers.length - 2}` : ""}`,
      };
    }
    return { statusLabel: "Đã xem", readByLabel: "" };
  }
  const hasOnlinePeer = conversation.memberIds
    .filter((id) => id !== currentUserId)
    .some((id) => Boolean(presenceMap[id]?.online));
  return { statusLabel: hasOnlinePeer ? "Đang gửi" : "Đã gửi", readByLabel: "" };
}
