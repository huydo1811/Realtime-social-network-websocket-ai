"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { chatApi } from "@/lib/api/chatApi";
import {
  AdminChatConversationResponse,
  AdminRoomAppearanceDetailResponse,
  ChatBackgroundPresetResponse,
} from "@/types/chat";
import { getUserById } from "@/lib/api/userApi";

type BubbleTheme = "ROSE" | "OCEAN" | "FOREST" | "SUNSET";
type BackgroundTheme = "PLAIN" | "MESH" | "DOTS";

function compactText(text?: string | null): string {
  const normalized = (text || "").trim();
  if (!normalized) return "Chưa có nội dung";
  return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
}

export default function AdminChatAppearancePage() {
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [conversations, setConversations] = useState<AdminChatConversationResponse[]>([]);
  const [activeConversation, setActiveConversation] = useState<AdminChatConversationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [nameMap, setNameMap] = useState<Record<number, string>>({});
  const [loadingPresets, setLoadingPresets] = useState(true);

  const [nickname, setNickname] = useState("");
  const [bubbleTheme, setBubbleTheme] = useState<BubbleTheme>("ROSE");
  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>("PLAIN");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [uploadedBackgroundUrl, setUploadedBackgroundUrl] = useState<string>("");
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [backgroundPresets, setBackgroundPresets] = useState<ChatBackgroundPresetResponse[]>([]);
  const [memberRoomDetail, setMemberRoomDetail] = useState<AdminRoomAppearanceDetailResponse | null>(null);
  const [loadingMemberRoom, setLoadingMemberRoom] = useState(false);

  const reloadPresets = async () => {
    setLoadingPresets(true);
    setError(null);
    try {
      const list = await chatApi.adminListBackgroundPresets();
      setBackgroundPresets(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải thư viện preset");
    } finally {
      setLoadingPresets(false);
    }
  };

  const reloadConversations = async () => {
    setLoadingConversations(true);
    setError(null);
    try {
      const list = await chatApi.adminListConversations({
        keyword: keyword.trim() || undefined,
      });
      setConversations(list);
      setConversationsLoaded(true);
      setActiveConversation((prev) => {
        if (!prev) return null;
        return list.find((x) => x.id === prev.id) || null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải dữ liệu");
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    void reloadPresets();
  }, []);

  useEffect(() => {
    if (!activeConversation) return;
    setNickname(activeConversation.name || "");
    setBubbleTheme((activeConversation.bubbleTheme || "ROSE") as BubbleTheme);
    setBackgroundTheme((activeConversation.backgroundTheme || "PLAIN") as BackgroundTheme);
  }, [activeConversation]);

  useEffect(() => {
    if (!activeConversation?.id) {
      setMemberRoomDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingMemberRoom(true);
    chatApi
      .adminGetRoomMemberAppearances(activeConversation.id)
      .then((data) => {
        if (!cancelled) setMemberRoomDetail(data);
      })
      .catch(() => {
        if (!cancelled) setMemberRoomDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingMemberRoom(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeConversation?.id]);

  useEffect(() => {
    const ids = [...new Set(conversations.flatMap((c) => c.memberIds))];
    if (!ids.length) return;
    Promise.all(
      ids.map(async (id) => {
        try {
          const profile = await getUserById(String(id));
          return [id, profile.fullName || `User #${id}`] as const;
        } catch {
          return [id, `User #${id}`] as const;
        }
      })
    ).then((pairs) => {
      setNameMap((prev) => {
        const next = { ...prev };
        pairs.forEach(([id, name]) => {
          next[id] = name;
        });
        return next;
      });
    });
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    const keywordLower = keyword.trim().toLowerCase();
    return conversations.filter((conversation) => {
      if (!keywordLower) return true;
      return (
        String(conversation.id).includes(keywordLower) ||
        (conversation.name || "").toLowerCase().includes(keywordLower) ||
        compactText(conversation.lastMessagePreview).toLowerCase().includes(keywordLower)
      );
    });
  }, [conversations, keyword]);

  const applyAppearance = async () => {
    if (!activeConversation) return;
    setSavingAppearance(true);
    setNotice(null);
    setError(null);
    try {
      await chatApi.adminUpdateConversationAppearance(activeConversation.id, {
        nickname: nickname.trim() || null,
        bubbleTheme,
        backgroundTheme,
        backgroundImageUrl: uploadedBackgroundUrl.trim() || null,
        targetUserId: targetUserId.trim() ? Number(targetUserId) : null,
      });
      setNotice("Đã cập nhật giao diện tin nhắn thành công");
      await reloadConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể cập nhật giao diện tin nhắn");
    } finally {
      setSavingAppearance(false);
    }
  };

  const handleUploadBackground = async (file: File | null) => {
    if (!file) return;
    setUploadingBackground(true);
    setError(null);
    try {
      const result = await chatApi.uploadAttachment(file);
      setUploadedBackgroundUrl(result.url);
      setNotice("Đã tải background lên cloud.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải background");
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleCreatePreset = async () => {
    if (!uploadedBackgroundUrl.trim()) {
      setError("Bạn cần upload ảnh nền trước.");
      return;
    }
    try {
      const created = await chatApi.adminCreateBackgroundPreset({
        name: presetName.trim() || `Preset ${new Date().toLocaleDateString("vi-VN")}`,
        imageUrl: uploadedBackgroundUrl.trim(),
      });
      setBackgroundPresets((prev) => [created, ...prev]);
      setNotice("Đã lưu preset background.");
      setPresetName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tạo ảnh nền");
    }
  };

  const handleDeletePreset = async (presetId: number) => {
    try {
      await chatApi.adminDeleteBackgroundPreset(presetId);
      setBackgroundPresets((prev) => prev.filter((item) => item.id !== presetId));
      setNotice("Đã gỡ preset khỏi thư viện.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xóa ảnh nền");
    }
  };

  const handleClearMemberBackground = async (userId: number) => {
    if (!activeConversation) return;
    setError(null);
    try {
      await chatApi.adminClearMemberBackgroundImage(activeConversation.id, userId);
      const data = await chatApi.adminGetRoomMemberAppearances(activeConversation.id);
      setMemberRoomDetail(data);
      setNotice("Đã gỡ ảnh nền của thành viên (user vẫn giữ theme khác).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể gỡ ảnh nền");
    }
  };

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Giao diện chat</h1>
            <p className="mt-1 text-sm text-slate-500">
              Thư viện preset chung; phần phòng bên dưới để xem và gỡ ảnh nền từng thành viên khi cần can thiệp.
            </p>
          </div>
          <Link
            href="/admin/chat"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            ← Quản lý nội dung
          </Link>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Thư viện ảnh nền (preset)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Upload hoặc chọn preset — người dùng có thể áp dụng trong cài đặt tin nhắn. Không cần chọn phòng.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={uploadedBackgroundUrl}
            onChange={(e) => setUploadedBackgroundUrl(e.target.value)}
            placeholder="URL background ảnh"
            className="h-10 min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-rose-300"
          />
          <label className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">
            {uploadingBackground ? "Đang tải..." : "Tải ảnh nền"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingBackground}
              onChange={(e) => void handleUploadBackground(e.target.files?.[0] || null)}
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Tên preset..."
            className="h-9 min-w-[200px] rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-rose-300"
          />
          <button
            type="button"
            onClick={() => void handleCreatePreset()}
            className="cursor-pointer rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Lưu vào thư viện
          </button>
          <button
            type="button"
            onClick={() => void reloadPresets()}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Làm mới thư viện
          </button>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-slate-600">Preset (thumbnail)</p>
          {loadingPresets ? (
            <p className="py-6 text-center text-sm text-slate-400">Đang tải thư viện...</p>
          ) : backgroundPresets.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Chưa có preset — upload và lưu vào thư viện.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {backgroundPresets.map((preset) => (
                <div key={preset.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setUploadedBackgroundUrl(preset.imageUrl)}
                    className="relative block aspect-square w-full"
                    title={preset.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preset.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1 py-0.5 text-[10px] text-white">
                      {preset.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeletePreset(preset.id)}
                    className="absolute right-1 top-1 rounded-md bg-rose-600/90 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100"
                  >
                    Gỡ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Theo phòng — ảnh nền từng thành viên</h2>
        <p className="mt-1 text-xs text-slate-500">
          User tự lưu ảnh nền vẫn dùng bình thường; admin chỉ xem phòng nào có ảnh gì và gỡ khi không phù hợp (chỉ xóa URL ảnh, không khóa tài khoản).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm phòng (ID, tên)..."
            className="h-10 min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-rose-300"
          />
          <button
            type="button"
            onClick={() => void reloadConversations()}
            className="cursor-pointer rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
          >
            {loadingConversations ? "Đang tải..." : "Tải danh sách phòng"}
          </button>
        </div>
        {!conversationsLoaded && !loadingConversations ? (
          <p className="mt-4 text-sm text-slate-400">Nhấn &quot;Tải danh sách phòng&quot; khi cần chỉnh theo phòng.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.4fr]">
            <aside className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
                {loadingConversations ? (
                  <p className="py-8 text-center text-sm text-slate-400">Đang tải...</p>
                ) : filteredConversations.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">Không có phòng khớp bộ lọc.</p>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setActiveConversation(conv)}
                      className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-left transition ${
                        activeConversation?.id === conv.id
                          ? "border-rose-200 bg-rose-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          #{conv.id} · {conv.type}
                        </p>
                        <span className="text-[11px] text-slate-400">{conv.messageCount} tin</span>
                      </div>
                      <p className="truncate text-xs text-slate-500">{conv.name || "Không tên"}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        {conv.memberIds.map((id) => nameMap[id] || `#${id}`).join(", ")}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </aside>
            <section>
              {!activeConversation ? (
                <p className="text-sm text-slate-400">Chọn một hội thoại trong danh sách.</p>
              ) : (
                <>
                  <p className="text-xs text-slate-500">Phòng #{activeConversation.id}</p>

                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <p className="text-xs font-semibold text-slate-700">Ảnh nền đang dùng (theo user trong phòng)</p>
                    {loadingMemberRoom ? (
                      <p className="mt-2 text-sm text-slate-400">Đang tải...</p>
                    ) : !memberRoomDetail ? (
                      <p className="mt-2 text-sm text-slate-400">Không tải được dữ liệu.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {memberRoomDetail.members.map((m) => {
                          const hasImg = !!(m.backgroundImageUrl && m.backgroundImageUrl.trim());
                          const displayName = nameMap[m.userId] || `User #${m.userId}`;
                          return (
                            <div
                              key={m.userId}
                              className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-2 py-2"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-slate-800">
                                  {displayName}{" "}
                                  <span className="font-normal text-slate-400">(ID {m.userId})</span>
                                </p>
                                {hasImg ? (
                                  <div className="mt-1 flex items-center gap-2">
                                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-slate-200">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={m.backgroundImageUrl!} alt="" className="h-full w-full object-cover" />
                                    </div>
                                    <p className="truncate text-[10px] text-slate-500">{m.backgroundImageUrl}</p>
                                  </div>
                                ) : (
                                  <p className="mt-0.5 text-[11px] text-slate-400">Không có ảnh nền tùy chỉnh</p>
                                )}
                              </div>
                              {hasImg ? (
                                <button
                                  type="button"
                                  onClick={() => void handleClearMemberBackground(m.userId)}
                                  className="cursor-pointer rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-700"
                                >
                                  Gỡ ảnh nền
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <p className="mt-4 text-xs font-semibold text-slate-600">Chỉnh nhanh (theme / URL)</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Tên hiển thị (nickname)"
                      className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-rose-300"
                    />
                    <input
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      placeholder="User ID (trống = mặc định phòng)"
                      className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-rose-300"
                    />
                    <input
                      value={uploadedBackgroundUrl}
                      onChange={(e) => setUploadedBackgroundUrl(e.target.value)}
                      placeholder="URL background ảnh"
                      className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-rose-300 sm:col-span-2"
                    />
                    <select
                      value={bubbleTheme}
                      onChange={(e) => setBubbleTheme(e.target.value as BubbleTheme)}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300"
                    >
                      <option value="ROSE">Bubble ROSE</option>
                      <option value="OCEAN">Bubble OCEAN</option>
                      <option value="FOREST">Bubble FOREST</option>
                      <option value="SUNSET">Bubble SUNSET</option>
                    </select>
                    <select
                      value={backgroundTheme}
                      onChange={(e) => setBackgroundTheme(e.target.value as BackgroundTheme)}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300"
                    >
                      <option value="PLAIN">Background PLAIN</option>
                      <option value="MESH">Background MESH</option>
                      <option value="DOTS">Background DOTS</option>
                    </select>
                  </div>
                  <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      disabled={savingAppearance}
                      onClick={() => void applyAppearance()}
                      className="cursor-pointer rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
                    >
                      {savingAppearance ? "Đang lưu..." : "Lưu giao diện phòng"}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>

      {(notice || error) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm">
          {notice ? <span className="text-emerald-600">{notice}</span> : null}
          {error ? <span className="text-rose-600">{error}</span> : null}
        </div>
      )}
    </section>
  );
}
