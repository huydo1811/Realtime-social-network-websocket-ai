"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { chatApi } from "@/lib/api/chatApi";
import { setAdminChatAccessReason, getAdminChatAccessReason } from "@/lib/api/adminChatReason";
import {
  AdminChatAuditLogResponse,
  AdminChatConversationResponse,
  MessageResponse,
} from "@/types/chat";
import { getUserById } from "@/lib/api/userApi";

type ConversationTypeFilter = "ALL" | "PRIVATE" | "GROUP";

function formatDate(value?: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function compactText(text?: string | null): string {
  const normalized = (text || "").trim();
  if (!normalized) return "Chưa có nội dung";
  return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
}

const CONV_PAGE_SIZE = 14;
const MESSAGE_PAGE_SIZE = 50;

export default function AdminChatManagementPage() {
  const [accessReason, setAccessReasonState] = useState("");
  const [reasonGateOpen, setReasonGateOpen] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<ConversationTypeFilter>("ALL");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [conversations, setConversations] = useState<AdminChatConversationResponse[]>([]);
  const [activeConversation, setActiveConversation] = useState<AdminChatConversationResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [memberFilter, setMemberFilter] = useState("");
  const [senderFilter, setSenderFilter] = useState("");
  const [messageKeyword, setMessageKeyword] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [nameMap, setNameMap] = useState<Record<number, string>>({});
  const [convPage, setConvPage] = useState(0);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditRows, setAuditRows] = useState<AdminChatAuditLogResponse[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = getAdminChatAccessReason();
    if (existing) {
      setAccessReasonState(existing);
      setReasonGateOpen(false);
    } else {
      setReasonGateOpen(true);
    }
  }, []);

  const submitAccessGate = () => {
    const t = accessReason.trim();
    if (t.length < 8) {
      setGateError("Vui lòng nhập lý do truy cập (ít nhất 8 ký tự).");
      return;
    }
    setGateError(null);
    setAdminChatAccessReason(t);
    setReasonGateOpen(false);
  };

  const reloadConversations = async () => {
    setLoadingConversations(true);
    setError(null);
    try {
      const list = await chatApi.adminListConversations({
        keyword: keyword.trim() || undefined,
        type: typeFilter === "ALL" ? undefined : typeFilter,
      });
      setConversations(list);
      setConvPage(0);
      setActiveConversation((prev) => {
        if (!prev) return list[0] || null;
        return list.find((x) => x.id === prev.id) || list[0] || null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải dữ liệu chat quản trị");
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (reasonGateOpen) return;
    void reloadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, reasonGateOpen]);

  const loadMessagesInitial = async (conv: AdminChatConversationResponse) => {
    setLoadingMessages(true);
    setError(null);
    try {
      const list = await chatApi.adminGetMessages(conv.id, undefined, MESSAGE_PAGE_SIZE);
      setMessages([...list].reverse());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải tin nhắn hội thoại");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (reasonGateOpen || !activeConversation) {
      setMessages([]);
      return;
    }
    void loadMessagesInitial(activeConversation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id, reasonGateOpen]);

  useEffect(() => {
    const ids = new Set<number>();
    conversations.forEach((conversation) => {
      conversation.memberIds.forEach((id) => ids.add(id));
    });
    messages.forEach((message) => ids.add(message.senderId));
    const missing = [...ids].filter((id) => !nameMap[id]);
    if (!missing.length) return;
    Promise.all(
      missing.map(async (id) => {
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
  }, [conversations, messages, nameMap]);

  const memberSummary = useMemo(() => {
    if (!activeConversation) return "";
    return activeConversation.memberIds.map((id) => nameMap[id] || `User #${id}`).join(", ");
  }, [activeConversation, nameMap]);

  const filteredMessages = useMemo(() => {
    const senderKeyword = senderFilter.trim().toLowerCase();
    const textKeyword = messageKeyword.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate).getTime() : null;
    const to = toDate ? new Date(toDate).getTime() : null;
    return messages.filter((msg) => {
      if (senderKeyword) {
        const senderName = (nameMap[msg.senderId] || `user #${msg.senderId}`).toLowerCase();
        if (!senderName.includes(senderKeyword) && String(msg.senderId) !== senderKeyword) return false;
      }
      if (textKeyword && !msg.content.toLowerCase().includes(textKeyword)) return false;
      const created = new Date(msg.createdAt).getTime();
      if (from != null && created < from) return false;
      if (to != null && created > to + 24 * 60 * 60 * 1000 - 1) return false;
      return true;
    });
  }, [fromDate, messageKeyword, messages, nameMap, senderFilter, toDate]);

  const filteredConversations = useMemo(() => {
    const keywordLower = keyword.trim().toLowerCase();
    const memberLower = memberFilter.trim().toLowerCase();
    return conversations.filter((conversation) => {
      if (keywordLower) {
        const matched =
          String(conversation.id).includes(keywordLower) ||
          (conversation.name || "").toLowerCase().includes(keywordLower) ||
          compactText(conversation.lastMessagePreview).toLowerCase().includes(keywordLower);
        if (!matched) return false;
      }
      if (memberLower) {
        const matchedMember = conversation.memberIds.some((id) => {
          const display = (nameMap[id] || `user #${id}`).toLowerCase();
          return display.includes(memberLower) || String(id) === memberLower;
        });
        if (!matchedMember) return false;
      }
      return true;
    });
  }, [conversations, keyword, memberFilter, nameMap]);

  const convPageMax = Math.max(0, Math.ceil(filteredConversations.length / CONV_PAGE_SIZE) - 1);
  const pagedConversations = useMemo(() => {
    const start = convPage * CONV_PAGE_SIZE;
    return filteredConversations.slice(start, start + CONV_PAGE_SIZE);
  }, [filteredConversations, convPage]);

  useEffect(() => {
    setConvPage((p) => Math.min(p, convPageMax));
  }, [convPageMax]);

  const loadOlderMessages = async () => {
    if (!activeConversation || messages.length === 0 || loadingOlderMessages) return;
    const oldestId = messages[0].id;
    setLoadingOlderMessages(true);
    try {
      const batch = await chatApi.adminGetMessages(activeConversation.id, oldestId, MESSAGE_PAGE_SIZE);
      if (batch.length === 0) {
        setNotice("Đã tải hết tin nhắn cũ hơn.");
        return;
      }
      setMessages((prev) => [...[...batch].reverse(), ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải thêm tin được");
    } finally {
      setLoadingOlderMessages(false);
    }
  };

  const exportCsv = () => {
    const header = ["id", "senderId", "senderName", "createdAt", "content"];
    const lines = [
      header.join(","),
      ...filteredMessages.map((m) => {
        const name = nameMap[m.senderId] || "";
        const content = m.deleted ? "[deleted]" : `"${m.content.replace(/"/g, '""')}"`;
        return [m.id, m.senderId, `"${name}"`, m.createdAt, content].join(",");
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${activeConversation?.id ?? "room"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Đã xuất CSV.");
  };

  const openAudit = async () => {
    setAuditOpen(true);
    setAuditLoading(true);
    try {
      const res = await chatApi.adminListAuditLogs(0, 40);
      setAuditRows(res.items);
    } catch {
      setAuditRows([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm("Xóa tin nhắn này khỏi cuộc trò chuyện?")) return;
    try {
      await chatApi.adminDeleteMessage(messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deleted: true, content: "[deleted by admin]" } : m))
      );
      setNotice("Đã gỡ nội dung tin nhắn");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xóa tin nhắn");
    }
  };

  if (reasonGateOpen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Xác nhận truy cập quản trị</h2>
          <p className="text-sm text-slate-500 mt-2">
            Nhập lý do xem nội dung chat (ghi nhận trong nhật ký kiểm toán). Tối thiểu 8 ký tự.
          </p>
          <textarea
            value={accessReason}
            onChange={(e) => setAccessReasonState(e.target.value)}
            rows={4}
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-300"
            placeholder="Ví dụ: Xử lý báo cáo #123, yêu cầu từ user X..."
          />
          {gateError && <p className="mt-2 text-xs text-rose-600">{gateError}</p>}
          <button
            type="button"
            onClick={() => void submitAccessGate()}
            className="mt-4 w-full rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"
          >
            Tiếp tục
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý nội dung chat</h1>
            <p className="mt-1 text-sm text-slate-500">
              Xem tin nhắn, gỡ vi phạm, xuất dữ liệu. Mọi thao tác gắn với lý do truy cập đã lưu.
            </p>
            <p className="mt-2 text-[11px] text-slate-400 truncate max-w-xl">
              Lý do hiện tại: <span className="font-medium text-slate-600">{getAdminChatAccessReason() || "—"}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setAdminChatAccessReason("");
                setReasonGateOpen(true);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Đổi lý do
            </button>
            <button
              type="button"
              onClick={() => void openAudit()}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Nhật ký kiểm toán
            </button>
            <Link
              href="/admin/chat-appearance"
              className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600"
            >
              Giao diện chat →
            </Link>
          </div>
        </div>
      </header>

      {auditOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="font-bold text-slate-800">Nhật ký thao tác admin (chat)</h3>
              <button type="button" onClick={() => setAuditOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-3 text-xs">
              {auditLoading ? (
                <p className="text-slate-400">Đang tải...</p>
              ) : auditRows.length === 0 ? (
                <p className="text-slate-400">Chưa có bản ghi.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-2 pr-2">Thời gian</th>
                      <th className="py-2 pr-2">Admin</th>
                      <th className="py-2 pr-2">Hành động</th>
                      <th className="py-2 pr-2">Phòng</th>
                      <th className="py-2 pr-2">Lý do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50">
                        <td className="py-2 pr-2 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                        <td className="py-2 pr-2">{r.adminUserId}</td>
                        <td className="py-2 pr-2">{r.action}</td>
                        <td className="py-2 pr-2">{r.conversationId ?? "—"}</td>
                        <td className="py-2 pr-2 max-w-[200px] truncate" title={r.reason || ""}>
                          {r.reason || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.4fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex gap-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo ID/tên phòng..."
              className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-rose-300"
            />
            <input
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              placeholder="Lọc thành viên..."
              className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-rose-300"
            />
            <button
              type="button"
              onClick={() => void reloadConversations()}
              className="cursor-pointer rounded-xl bg-rose-500 px-3 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Tải
            </button>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {(["ALL", "PRIVATE", "GROUP"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(value)}
                className={`cursor-pointer rounded-xl border px-2 py-1.5 text-xs font-semibold ${
                  typeFilter === value
                    ? "border-rose-200 bg-rose-50 text-rose-600"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {value === "ALL" ? "Tất cả" : value === "PRIVATE" ? "Riêng tư" : "Nhóm"}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
            <span>
              {filteredConversations.length} phòng · Trang {convPage + 1}/{convPageMax + 1 || 1}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={convPage <= 0}
                onClick={() => setConvPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border px-2 py-0.5 disabled:opacity-40"
              >
                ←
              </button>
              <button
                type="button"
                disabled={convPage >= convPageMax}
                onClick={() => setConvPage((p) => Math.min(convPageMax, p + 1))}
                className="rounded-lg border px-2 py-0.5 disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
          <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1">
            {loadingConversations ? (
              <p className="py-8 text-center text-sm text-slate-400">Đang tải hội thoại...</p>
            ) : pagedConversations.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Không có dữ liệu</p>
            ) : (
              pagedConversations.map((conv) => (
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
                    {conv.memberIds.map((id) => nameMap[id] || `User #${id}`).join(", ")}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-slate-400">{compactText(conv.lastMessagePreview)}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Nội dung hội thoại</h2>
            {activeConversation && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => exportCsv()}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Xuất CSV (đã lọc)
                </button>
              </div>
            )}
          </div>
          {notice && <p className="mt-2 text-xs text-emerald-600">{notice}</p>}
          {error && !reasonGateOpen && <p className="mt-2 text-xs text-rose-600">{error}</p>}
          {activeConversation ? (
            <>
              <p className="mt-1 text-xs text-slate-500">
                Thành viên: {memberSummary || "--"} | Tạo lúc: {formatDate(activeConversation.createdAt)}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                <input
                  value={senderFilter}
                  onChange={(e) => setSenderFilter(e.target.value)}
                  placeholder="Lọc người gửi"
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-rose-300"
                />
                <input
                  value={messageKeyword}
                  onChange={(e) => setMessageKeyword(e.target.value)}
                  placeholder="Lọc nội dung"
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-rose-300"
                />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-rose-300"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-rose-300"
                />
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  disabled={loadingOlderMessages || loadingMessages}
                  onClick={() => void loadOlderMessages()}
                  className="cursor-pointer text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                >
                  {loadingOlderMessages ? "Đang tải tin cũ..." : "↑ Tải thêm tin nhắn cũ hơn"}
                </button>
              </div>
              <div className="mt-3 max-h-[38vh] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                {loadingMessages ? (
                  <p className="text-sm text-slate-400">Đang tải tin nhắn...</p>
                ) : filteredMessages.length === 0 ? (
                  <p className="text-sm text-slate-400">Chưa có tin nhắn</p>
                ) : (
                  filteredMessages.map((msg) => (
                    <div key={msg.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-slate-700">
                          Tin #{msg.id} · {nameMap[msg.senderId] || `User ${msg.senderId}`}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">{formatDate(msg.createdAt)}</span>
                          {!msg.deleted && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteMessage(msg.id)}
                              className="cursor-pointer rounded-md bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100"
                            >
                              Gỡ
                            </button>
                          )}
                        </div>
                      </div>
                      <p className={`mt-1.5 text-sm ${msg.deleted ? "italic text-slate-400" : "text-slate-700"}`}>
                        {msg.deleted ? "Tin nhắn đã bị gỡ" : msg.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Chọn một hội thoại để quản lý nội dung.</p>
          )}
        </section>
      </div>
    </section>
  );
}
