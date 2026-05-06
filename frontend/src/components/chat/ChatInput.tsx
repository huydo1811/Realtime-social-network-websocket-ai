"use client";
import { ChangeEvent, ClipboardEvent, DragEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

interface PendingAttachment {
  id: string;
  file: File;
  previewUrl: string | null;
}

interface Props {
  onSend: (payload: { text: string; files: File[] }) => Promise<void> | void;
  disabled?: boolean;
  sending?: boolean;
  replyPreview?: string;
  onCancelReply?: () => void;
  onTypingChange?: (typing: boolean) => void;
}

export default function ChatInput({ onSend, disabled, sending, replyPreview, onCancelReply, onTypingChange }: Props) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<PendingAttachment[]>([]);
  const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

  const handleSend = async () => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || disabled || sending) return;
    const files = attachments.map((item) => item.file);
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
    clearLocalPreviews(attachments);
    setAttachments([]);
    onTypingChange?.(false);
    await onSend({ text: trimmed, files });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  useEffect(() => {
    onTypingChange?.(value.trim().length > 0);
  }, [onTypingChange, value]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    if (!attachMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (target && menuRef.current && !menuRef.current.contains(target)) setAttachMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [attachMenuOpen]);

  useEffect(() => {
    if (!pickerError) return;
    const t = window.setTimeout(() => setPickerError(null), 4000);
    return () => window.clearTimeout(t);
  }, [pickerError]);

  useEffect(() => {
    return () => clearLocalPreviews(attachmentsRef.current);
  }, []);

  const validatePickedFile = (file: File): { ok: boolean; error?: string; previewUrl: boolean } => {
    const name = file.name || "file";
    const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
    const isImage = file.type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
    const isVideo = file.type.startsWith("video/") || ["mp4", "mov", "webm", "mkv", "m4v"].includes(ext);
    const isPdf = file.type === "application/pdf" || ext === "pdf";
    const isTxt = file.type.startsWith("text/") || ext === "txt";

    if (isImage) return { ok: true, previewUrl: true };
    if (isVideo) {
      if (file.size > MAX_VIDEO_BYTES) return { ok: false, error: `${name}: video phải nhỏ hơn 100MB.`, previewUrl: false };
      return { ok: true, previewUrl: true };
    }
    if (isPdf || isTxt) return { ok: true, previewUrl: false };
    return { ok: false, error: `${name}: chỉ hỗ trợ ảnh, video, PDF hoặc TXT.`, previewUrl: false };
  };

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    let firstError: string | null = null;
    const nextItems: PendingAttachment[] = [];
    arr.forEach((file) => {
      const validation = validatePickedFile(file);
      if (!validation.ok) {
        firstError = firstError ?? validation.error ?? null;
        return;
      }
      nextItems.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        previewUrl: validation.previewUrl ? URL.createObjectURL(file) : null,
      });
    });
    if (firstError) setPickerError(firstError);
    if (!nextItems.length) return;
    setAttachments((prev) => [...prev, ...nextItems]);
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) addFiles(files);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) addFiles(files);
  };

  const onPickerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) addFiles(files);
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-3">
      {replyPreview && (
        <div className="mb-2 rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2 text-xs text-rose-700 flex items-center justify-between">
          <span className="truncate pr-3">Đang trả lời: {replyPreview}</span>
          <button type="button" onClick={onCancelReply} className="text-rose-500 hover:text-rose-700">Hủy</button>
        </div>
      )}
      {pickerError && <div className="mb-2 text-[12px] text-rose-600">{pickerError}</div>}
      {attachments.length > 0 && (
        <div className="mb-2 rounded-2xl border border-slate-200 p-2">
          <p className="text-xs font-semibold text-slate-500 mb-2">Xem trước tệp đính kèm</p>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {attachments.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-2 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{item.file.name}</p>
                    <p className="text-[11px] text-slate-400">{Math.max(1, Math.round(item.file.size / 1024))} KB</p>
                  </div>
                  <button type="button" onClick={() => removeAttachment(item.id)} className="text-slate-400 hover:text-rose-500">x</button>
                </div>
                {item.previewUrl && (
                  <div className="mt-2">
                    {item.file.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.previewUrl} alt={item.file.name} className="max-h-44 rounded-lg object-cover" />
                    ) : item.file.type.startsWith("video/") ? (
                      <video src={item.previewUrl} className="max-h-44 rounded-lg" controls preload="metadata" />
                    ) : null}
                  </div>
                )}
                <div className="mt-1 text-[11px] text-slate-500">Sẽ upload khi bấm gửi</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div
        className={`flex items-end gap-2 rounded-2xl border px-3 py-2 transition ${dragging ? "border-rose-300 bg-rose-50/40" : "border-slate-200 bg-white"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setAttachMenuOpen((v) => !v)} className="cursor-pointer mb-1 w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">+</button>
          {attachMenuOpen && (
            <div className="absolute bottom-[44px] left-0 z-20 w-[220px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="flex items-stretch justify-between gap-2">
                <button type="button" onClick={() => { setAttachMenuOpen(false); imageInputRef.current?.click(); }} className="cursor-pointer inline-flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 px-2 py-2 hover:bg-slate-50"><span className="text-lg">🖼️</span><span className="text-xs">Ảnh</span></button>
                <button type="button" onClick={() => { setAttachMenuOpen(false); videoInputRef.current?.click(); }} className="cursor-pointer inline-flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 px-2 py-2 hover:bg-slate-50"><span className="text-lg">🎬</span><span className="text-xs">Video</span></button>
                <button type="button" onClick={() => { setAttachMenuOpen(false); fileInputRef.current?.click(); }} className="cursor-pointer inline-flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 px-2 py-2 hover:bg-slate-50"><span className="text-lg">📄</span><span className="text-xs">Tệp</span></button>
              </div>
            </div>
          )}
          <input ref={imageInputRef} type="file" multiple className="hidden" accept="image/*" onChange={onPickerChange} />
          <input ref={videoInputRef} type="file" multiple className="hidden" accept="video/*" onChange={onPickerChange} />
          <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.txt,text/plain,application/pdf" onChange={onPickerChange} />
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 160)}px`;
          }}
          onKeyDown={handleKeyDown}
          onPaste={onPaste}
          placeholder="Nhập tin nhắn... (Enter để gửi)"
          rows={1}
          className="chat-input-textarea flex-1 resize-none overflow-hidden outline-none text-sm leading-5 max-h-40 bg-transparent placeholder:text-slate-400 [scrollbar-width:none] [-ms-overflow-style:none] appearance-none"
          disabled={disabled || sending}
        />
        <button
          onClick={() => void handleSend()}
          disabled={(!value.trim() && attachments.length === 0) || disabled || sending}
          className="cursor-pointer mb-1 w-9 h-9 flex items-center justify-center rounded-xl bg-rose-500 text-white hover:bg-rose-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
      <style jsx>{`
        .chat-input-textarea::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        .chat-input-textarea::-webkit-resizer {
          display: none;
        }
      `}</style>
    </div>
  );
}

function clearLocalPreviews(items: PendingAttachment[]) {
  items.forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
}
