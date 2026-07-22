"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import type { PetDto } from "@/types/pet";

type Props = {
  avatarUrl: string;
  pets?: PetDto[];
  onSubmit: (payload: {
    content: string;
    mediaUrl?: string;
    visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
    petId?: number;
  }) => Promise<void> | void;
  initialPetId?: number;
};

export default function PostComposer({ avatarUrl, pets = [], onSubmit, initialPetId }: Props) {
  const [text, setText] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [mediaName, setMediaName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "FRIENDS" | "PRIVATE">(
    "PUBLIC"
  );
  const [selectedPetId, setSelectedPetId] = useState<number | "">("");

  useEffect(() => {
    const saved = localStorage.getItem("defaultPostVisibility");
    if (saved === "PUBLIC" || saved === "FRIENDS" || saved === "PRIVATE") {
      setVisibility(saved);
    }
  }, []);
  useEffect(() => {
    if (!pets.length) return;
    if (initialPetId && pets.some((pet) => pet.id === initialPetId)) {
      setSelectedPetId(initialPetId);
    }
  }, [initialPetId, pets]);
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  // autosize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const scrollHeight = Math.min(ta.scrollHeight, 220); // limit max height
    ta.style.height = `${scrollHeight}px`;
  }, [text]);

  const hasMedia = Boolean(mediaUrl);
  const canSubmit = hasMedia ? !uploading && !posting : Boolean(text.trim()) && !uploading && !posting;

  async function handleSubmit() {
    const content = text.trim();
    if (!hasMedia && !content) return;
    setPosting(true);
    setNotice(null);
    try {
      const selectedPet = pets.find((pet) => pet.id === selectedPetId);
      const petTags = selectedPet
        ? `🐾 Cùng bé: @pet_${selectedPet.id}_${selectedPet.name.replace(/\s+/g, "_")}`
        : "";
      const finalContent = [content, petTags].filter(Boolean).join("\n\n");
      await onSubmit({
        content: finalContent,
        mediaUrl,
        visibility,
        petId: selectedPet?.id,
      });
      setText("");
      setMediaUrl(undefined);
      setMediaName("");
      setSelectedPetId("");
      setVisibility("PUBLIC");
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể đăng bài viết. Vui lòng thử lại.";
      setNotice(message);
    } finally {
      setPosting(false);
    }
  }

  async function handlePickMedia(file?: File) {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const uploaded = await uploadToCloudinary(file);
      setMediaUrl(uploaded.secureUrl);
      setMediaName(file.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải ảnh/video lên.";
      setUploadError(message);
      setMediaUrl(undefined);
      setMediaName("");
    } finally {
      setUploading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
      {notice ? (
        <div
          role="alert"
          className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
        >
          {notice}
        </div>
      ) : null}
      <div className="flex gap-3">
        <Image
          src={avatarUrl}
          alt="avatar mini"
          width={44}
          height={44}
          className="h-11 w-11 rounded-full object-cover"
        />
        <div className="w-full">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (notice) setNotice(null);
            }}
            onKeyDown={onKeyDown}
            placeholder={
              hasMedia
                ? "Thêm mô tả (tuỳ chọn)..."
                : "Bạn đang nghĩ gì hôm nay?"
            }
            aria-label="Viết bài"
            className="w-full resize-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
          />
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-600">
                  {mediaName || "Chưa chọn ảnh/video"}
                </p>
              </div>
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => void handlePickMedia(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                className="cursor-pointer rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {uploading ? "Đang tải..." : "Chọn ảnh/video"}
              </button>
            </div>
            {uploadError ? <p className="text-xs text-rose-600">{uploadError}</p> : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                {pets.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Thú cưng:</span>
                    <select
                      value={selectedPetId}
                      onChange={(e) =>
                        setSelectedPetId(e.target.value ? Number(e.target.value) : "")
                      }
                      className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-rose-100"
                    >
                      <option value="">Không gắn thẻ thú cưng</option>
                      {pets.map((pet) => (
                        <option key={pet.id} value={pet.id}>
                          {pet.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Quyền xem:</span>
                  <select
                    value={visibility}
                    onChange={(e) =>
                      setVisibility(e.target.value as "PUBLIC" | "FRIENDS" | "PRIVATE")
                    }
                    className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 outline-none focus:ring-2 focus:ring-rose-100"
                  >
                    <option value="PUBLIC">Công khai</option>
                    <option value="FRIENDS">Bạn bè</option>
                    <option value="PRIVATE">Riêng tư</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="cursor-pointer rounded-full bg-rose-500 px-5 py-2 text-xs font-semibold text-white shadow-sm shadow-rose-200 transition hover:bg-rose-600 disabled:opacity-60"
                >
                  {posting ? "Đang đăng..." : "Đăng bài"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}