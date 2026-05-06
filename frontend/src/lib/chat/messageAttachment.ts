export type ChatAttachmentKind = "image" | "video" | "audio" | "file";

export interface ChatAttachment {
  kind: ChatAttachmentKind;
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

const ATTACHMENT_PREFIX = "[[chat-attachments]]";

export function encodeMessageContent(text: string, attachments: ChatAttachment[]): string {
  const trimmed = text.trim();
  if (!attachments.length) return trimmed;
  return `${ATTACHMENT_PREFIX}${JSON.stringify(attachments)}\n${trimmed}`;
}

export function decodeMessageContent(content: string): { text: string; attachments: ChatAttachment[] } {
  if (!content.startsWith(ATTACHMENT_PREFIX)) {
    return { text: content, attachments: [] };
  }

  const newlineIdx = content.indexOf("\n");
  const rawJson = (newlineIdx >= 0 ? content.slice(ATTACHMENT_PREFIX.length, newlineIdx) : content.slice(ATTACHMENT_PREFIX.length)).trim();
  const text = newlineIdx >= 0 ? content.slice(newlineIdx + 1) : "";
  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return { text, attachments: [] };
    const attachments = parsed
      .filter((item) => item && typeof item === "object" && typeof item.url === "string")
      .map((item) => ({
        kind: normalizeKind(item.kind, item.mimeType),
        url: String(item.url),
        name: String(item.name ?? "file"),
        mimeType: String(item.mimeType ?? "application/octet-stream"),
        size: Number(item.size ?? 0),
      }));
    return { text, attachments };
  } catch {
    return { text: content, attachments: [] };
  }
}

function normalizeKind(kind: unknown, mimeType: unknown): ChatAttachmentKind {
  if (kind === "image" || kind === "video" || kind === "audio" || kind === "file") return kind;
  const mime = typeof mimeType === "string" ? mimeType.toLowerCase() : "";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}
