"use client";

import Image from "next/image";

function isVideoUrl(url: string) {
  const value = url.toLowerCase();
  return (
    value.includes("/video/upload/") ||
    value.endsWith(".mp4") ||
    value.endsWith(".mov") ||
    value.endsWith(".webm") ||
    value.endsWith(".m4v") ||
    value.endsWith(".avi") ||
    value.endsWith(".mkv")
  );
}

type Props = {
  url: string;
  name?: string;
  onClear?: () => void;
  className?: string;
  compact?: boolean;
};

/** Preview selected media before submit (image or video). */
export default function MediaPreview({ url, name, onClear, className, compact }: Props) {
  if (!url) return null;
  const video = isVideoUrl(url);

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <p className="truncate text-xs text-slate-600">{name || (video ? "Video đã chọn" : "Ảnh đã chọn")}</p>
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Gỡ
          </button>
        ) : null}
      </div>
      {video ? (
        <video src={url} controls className={`w-full bg-black object-contain ${compact ? "max-h-40" : "max-h-72"}`} />
      ) : (
        <div className={`relative mx-auto w-full ${compact ? "h-40" : "aspect-video max-h-72"}`}>
          <Image src={url} alt={name || "preview"} fill className="object-contain" unoptimized />
        </div>
      )}
    </div>
  );
}
