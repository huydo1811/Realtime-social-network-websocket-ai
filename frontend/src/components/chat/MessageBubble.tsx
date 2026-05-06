// frontend/src/components/chat/MessageBubble.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { MessageResponse } from "@/types/chat";
import { decodeMessageContent, type ChatAttachmentKind } from "@/lib/chat/messageAttachment";
import { chatApi } from "@/lib/api/chatApi";

interface Props {
  message: MessageResponse;
  isOwn: boolean;
  showAvatar?: boolean;
  senderGradient?: string;
  senderName?: string;
  highlightTerm?: string;
  isActiveSearchHit?: boolean;
  isStarred?: boolean;
  replyPreview?: string;
  replyToMessageId?: number | null;
  onJumpToReplyTarget?: (messageId: number) => void;
  onReply?: (message: MessageResponse) => void;
  onToggleStar?: (messageId: number) => void;
  onEdit?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
  ownBubbleClassName?: string;
  peerBubbleClassName?: string;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  senderGradient = "from-slate-400 to-slate-500",
  senderName,
  highlightTerm,
  isActiveSearchHit,
  isStarred,
  replyPreview,
  replyToMessageId,
  onJumpToReplyTarget,
  onReply,
  onToggleStar,
  onEdit,
  onDelete,
  ownBubbleClassName,
  peerBubbleClassName,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const [hovered, setHovered] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<{ url: string; kind: ChatAttachmentKind; name: string } | null>(null);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    editInputRef.current?.focus({ preventScroll: true });
  }, [editing]);

  useEffect(() => {
    if (!lightbox) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox]);

  if (message.deleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-3 py-0.5`}>
        <span className="text-xs italic rounded-2xl px-3 border text-slate-400 bg-slate-50 border-slate-100 py-1.5">
          Tin nhắn đã bị xóa
        </span>
      </div>
    );
  }

  const parsed = decodeMessageContent(message.content);
  const textContent = parsed.text;
  const attachments = parsed.attachments;
  const isMediaOnly = attachments.length > 0 && !textContent.trim();
  const isFileOnly =
    attachments.length > 0 &&
    !textContent.trim() &&
    attachments.every((item) => item.kind === "file" || item.kind === "audio");
  const isSingleImage = isMediaOnly && attachments.length === 1 && attachments[0].kind === "image";
  const isSingleVideo = isMediaOnly && attachments.length === 1 && attachments[0].kind === "video";
  const maxWidthClass = isSingleImage || isSingleVideo || isFileOnly ? "max-w-[92%] sm:max-w-[560px]" : "max-w-[78%]";

  const renderHighlightedContent = () => {
    const content = textContent;
    const term = highlightTerm?.trim();
    if (!term) return content;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "ig");
    const parts = content.split(regex);
    const lowerTerm = term.toLowerCase();
    return parts.map((part, idx) =>
      part.toLowerCase() === lowerTerm ? (
        <mark key={`${part}-${idx}`} className="bg-yellow-200 text-inherit rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={`${part}-${idx}`}>{part}</span>
      )
    );
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      setDownloadingUrl(url);
      const signedUrl = await chatApi.getDownloadUrl(url, filename);
      const anchor = document.createElement("a");
      anchor.href = signedUrl;
      anchor.download = filename || "attachment";
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      window.open(toDownloadUrl(url, filename), "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingUrl(null);
    }
  };

  return (
    <div
      className={`flex items-end ${isOwn ? "justify-end" : "justify-start"} px-3 py-0.5 group`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isOwn && (
        <div className="w-8 mr-2 flex-shrink-0">
          {showAvatar && (
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${senderGradient}
              flex items-center justify-center text-white text-xs font-bold shadow-sm`}
            >
              {(senderName?.trim()?.charAt(0) || message.senderId.toString().charAt(0)).toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className={`flex flex-col ${maxWidthClass} ${isOwn ? "items-end ml-10" : "items-start"}`}>
        {editing ? (
          <div className="flex gap-2 items-center w-full">
            <input
              ref={editInputRef}
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const next = editVal.trim();
                  if (next) onEdit?.(message.id, next);
                  setEditing(false);
                }
                if (e.key === "Escape") {
                  setEditVal(message.content);
                  setEditing(false);
                }
              }}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-rose-300 outline-none focus:ring-2 focus:ring-rose-100"
            />
            <button
              onClick={() => {
                setEditVal(message.content);
                setEditing(false);
              }}
              className="cursor-pointer text-xs text-slate-400"
            >
              Hủy
            </button>
          </div>
        ) : (
          <div
            className={`relative break-words shadow-sm
            ${
              isSingleImage || isSingleVideo || isFileOnly
                ? "bg-transparent"
                : `rounded-2xl text-sm px-4 py-2.5 leading-relaxed ${
                    isOwn
                      ? ownBubbleClassName || "bg-rose-500 text-white rounded-br-sm"
                      : peerBubbleClassName || "bg-slate-100 text-slate-800 rounded-bl-sm"
                  }`
            }
            ${isActiveSearchHit ? "ring-2 ring-amber-300" : ""}`}
          >
            {replyPreview && (
              <button
                type="button"
                onClick={() => {
                  if (replyToMessageId) onJumpToReplyTarget?.(replyToMessageId);
                }}
                className={`cursor-pointer mb-1.5 w-full text-left text-[11px] rounded-lg px-2.5 py-1.5 border transition
                ${
                  isSingleImage || isSingleVideo
                    ? "bg-white/85 border-slate-200 text-slate-600 hover:bg-slate-50"
                    : isOwn
                      ? "bg-rose-400/40 border-rose-300 text-rose-100 hover:bg-rose-400/55"
                      : "bg-white/85 border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {replyPreview}
              </button>
            )}

            {attachments.length > 0 ? (
              isSingleImage || isSingleVideo ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setLightbox({
                        url: attachments[0].url,
                        kind: attachments[0].kind,
                        name: attachments[0].name,
                      })
                    }
                    className="cursor-pointer w-full text-left"
                    title="Mở ảnh/video"
                  >
                    {isSingleImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachments[0].url}
                        alt={attachments[0].name}
                        className="rounded-2xl w-full max-h-[70vh] object-contain border border-slate-200 bg-white"
                      />
                    )}
                    {isSingleVideo && (
                      <video
                        src={attachments[0].url}
                        controls
                        className="rounded-2xl w-full max-h-[70vh] bg-black border border-slate-200"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDownload(attachments[0].url, attachments[0].name)}
                    className="cursor-pointer absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/55 text-white flex items-center justify-center"
                    title="Tải xuống"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" strokeLinecap="round" strokeLinejoin="round">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5 5-5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((file) => (
                    <div
                      key={`${message.id}-${file.url}`}
                      className={`rounded-xl border px-3 py-2.5 text-xs ${
                        isFileOnly
                          ? "border-slate-200 bg-white text-slate-700 shadow-sm min-w-[280px]"
                          : isOwn
                            ? "border-white/30 bg-white/15"
                            : "border-slate-200 bg-white/90"
                      }`}
                    >
                      {file.kind === "image" && (
                        <button
                          type="button"
                          className="cursor-pointer w-full text-left"
                          onClick={() => setLightbox({ url: file.url, kind: file.kind, name: file.name })}
                          title="Mở ảnh"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={file.url} alt={file.name} className="mb-2 max-h-56 w-full rounded-md object-cover" />
                        </button>
                      )}
                      {file.kind === "video" && (
                        <video src={file.url} controls className="mb-2 max-h-56 w-full rounded-md bg-black/80" />
                      )}
                      {file.kind === "audio" && <audio src={file.url} controls className="mb-2 w-full" />}
                      {(file.kind === "file" || file.kind === "audio") && (
                        <div className="mb-1 flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">📄</span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-700">{file.name}</div>
                            <div className="text-[11px] text-slate-400">Tệp đính kèm</div>
                          </div>
                        </div>
                      )}

                      <div className="mt-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => void handleDownload(file.url, file.name)}
                          className={`cursor-pointer inline-flex items-center justify-center w-8 h-8 rounded-full ${
                            isFileOnly
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-600"
                              : isOwn
                                ? "bg-white/20 hover:bg-white/30 text-white"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                          }`}
                          title="Tải xuống"
                          disabled={downloadingUrl === file.url}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="w-4 h-4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5 5-5" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {textContent && <div>{renderHighlightedContent()}</div>}
                </div>
              )
            ) : (
              renderHighlightedContent()
            )}
            {message.editedAt && (
              <span className={`text-[10px] ml-1.5 ${isOwn ? "text-rose-200" : "text-slate-400"}`}>
                (đã sửa)
              </span>
            )}
          </div>
        )}

        <div className={`flex items-center gap-2 mt-0.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity px-1">
            {fmtTime(message.createdAt)}
          </span>

          {hovered && !editing && (
            <div className="flex items-center gap-1">
              {onReply && (
                <button
                  onClick={() => onReply(message)}
                  className="cursor-pointer p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                  title="Trả lời"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v3m0 0l-3-3m3 3l3-3" />
                  </svg>
                </button>
              )}
              {onToggleStar && (
                <button
                  onClick={() => onToggleStar(message.id)}
                  className={`cursor-pointer p-1 rounded-full transition ${
                    isStarred ? "text-amber-500 hover:bg-amber-50" : "text-slate-400 hover:bg-slate-100 hover:text-amber-500"
                  }`}
                  title={isStarred ? "Bỏ ghim sao" : "Ghim sao"}
                >
                  <svg className="w-3.5 h-3.5" fill={isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.033 6.26a1 1 0 00.95.69h6.58c.969 0 1.371 1.24.588 1.81l-5.322 3.867a1 1 0 00-.364 1.118l2.033 6.26c.3.922-.755 1.688-1.538 1.118l-5.322-3.866a1 1 0 00-1.176 0l-5.322 3.866c-.783.57-1.838-.196-1.539-1.118l2.034-6.26a1 1 0 00-.364-1.118L.898 11.687c-.783-.57-.38-1.81.588-1.81h6.58a1 1 0 00.95-.69l2.033-6.26z" />
                  </svg>
                </button>
              )}
              {isOwn && (
                <>
              <button
                onClick={() => {
                  setEditVal(message.content);
                  setEditing(true);
                }}
                className="cursor-pointer p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                title="Sửa"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>

              <button
                onClick={() => onDelete?.(message.id)}
                className="cursor-pointer p-1 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition"
                title="Xóa"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
                </>
              )}
            </div>
          )}
        </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-[980px]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="cursor-pointer absolute -top-3 right-0 bg-white rounded-full shadow w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-50"
              title="Đóng"
            >
              ×
            </button>
            {lightbox.kind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightbox.url}
                alt={lightbox.name}
                className="w-full max-h-[78vh] object-contain rounded-2xl bg-black"
              />
            )}
            {lightbox.kind === "video" && (
              <video src={lightbox.url} controls className="w-full max-h-[78vh] rounded-2xl bg-black" />
            )}
            {lightbox.kind !== "image" && lightbox.kind !== "video" && (
              <a href={lightbox.url} className="text-white underline" download>
                Tải xuống {lightbox.name}
              </a>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function toDownloadUrl(url: string, filename: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("res.cloudinary.com")) {
      const parts = parsed.pathname.split("/upload/");
      if (parts.length === 2) {
        const transformed = `${parts[0]}/upload/fl_attachment:${encodeURIComponent(filename || "attachment")}/${parts[1]}`;
        return `${parsed.origin}${transformed}`;
      }
    }
    return parsed.toString();
  } catch {
    return url;
  }
}