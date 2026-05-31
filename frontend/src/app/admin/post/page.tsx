"use client";

import { useMemo, useState } from "react";
import { postApi } from "@/lib/api/postApi";
import type { PostDto } from "@/types/post";
import { isVideoUrl } from "@/lib/cloudinary/upload";

const PAGE_SIZE = 12;

function formatDate(value?: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN");
}

export default function AdminPostPage() {
  const [userIdInput, setUserIdInput] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [posts, setPosts] = useState<PostDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "REJECTED" | "DELETED">("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | "PUBLIC" | "FRIENDS" | "PRIVATE">("ALL");

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchStatus = statusFilter === "ALL" || post.status === statusFilter;
      const matchVisibility = visibilityFilter === "ALL" || post.visibility === visibilityFilter;
      return matchStatus && matchVisibility;
    });
  }, [posts, statusFilter, visibilityFilter]);

  const loadPosts = async (targetPage = 0, nextUserId?: number) => {
    const userId = nextUserId ?? selectedUserId;
    if (!userId) {
      setError("Nhập userId để tải danh sách bài viết");
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const data = await postApi.listUserPosts(userId, targetPage, PAGE_SIZE);
      setPosts(data.content ?? []);
      setPage(data.page ?? targetPage);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
      setTotalElements(data.totalElements ?? 0);
      if ((data.content ?? []).length === 0) {
        setNotice("Người dùng này chưa có bài viết.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải danh sách bài viết");
      setPosts([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const parsed = Number(userIdInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Nhập userId hợp lệ");
      return;
    }
    setSelectedUserId(parsed);
    await loadPosts(0, parsed);
  };

  const handleHidePost = async (postId: number) => {
    if (!confirm(`Ẩn bài viết #${postId}?`)) return;
    setError(null);
    setNotice(null);
    try {
      const updated = await postApi.adminHide(postId);
      setPosts((prev) => prev.map((item) => (item.id === postId ? updated : item)));
      setNotice(`Đã ẩn bài viết #${postId}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể ẩn bài viết");
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm(`Xóa bài viết #${postId}?`)) return;
    setError(null);
    setNotice(null);
    try {
      await postApi.remove(postId);
      setPosts((prev) => prev.filter((item) => item.id !== postId));
      setNotice(`Đã xóa bài viết #${postId}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xóa bài viết");
    }
  };

  const handleUnhidePost = async (postId: number) => {
    if (!confirm(`Bật lại bài viết #${postId}?`)) return;
    setError(null);
    setNotice(null);
    try {
      const updated = await postApi.adminUnhide(postId);
      setPosts((prev) => prev.map((item) => (item.id === postId ? updated : item)));
      setNotice(`Đã bật lại bài viết #${postId}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể bật lại bài viết");
    }
  };

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý bài viết người dùng</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tải theo userId, theo dõi trạng thái hiển thị và xử lý ẩn/xóa bài viết.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            placeholder="Nhập userId..."
            className="h-10 min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-rose-300"
          />
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={loading}
            className="rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {loading ? "Đang tải..." : "Tải bài viết"}
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "APPROVED" | "REJECTED" | "DELETED")}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="DELETED">DELETED</option>
          </select>
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as "ALL" | "PUBLIC" | "FRIENDS" | "PRIVATE")}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300"
          >
            <option value="ALL">Mọi quyền xem</option>
            <option value="PUBLIC">PUBLIC</option>
            <option value="FRIENDS">FRIENDS</option>
            <option value="PRIVATE">PRIVATE</option>
          </select>
        </div>
      </header>

      {(error || notice) && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
          {error ? <p className="text-rose-600">{error}</p> : null}
          {notice ? <p className="text-emerald-600">{notice}</p> : null}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {selectedUserId
              ? `User ${selectedUserId} • ${filteredPosts.length}/${posts.length} bài trên trang • Tổng ${totalElements} bài`
              : "Nhập userId để bắt đầu"}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={loading || page <= 0 || !selectedUserId}
              onClick={() => void loadPosts(page - 1)}
              className="rounded-md border border-slate-200 px-2 py-0.5 disabled:opacity-50"
            >
              ←
            </button>
            <span className="px-1">
              Trang {page + 1}/{totalPages}
            </span>
            <button
              type="button"
              disabled={loading || page >= totalPages - 1 || !selectedUserId}
              onClick={() => void loadPosts(page + 1)}
              className="rounded-md border border-slate-200 px-2 py-0.5 disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-2">ID</th>
                <th className="py-2 pr-2">Tác giả</th>
                <th className="py-2 pr-2">Nội dung</th>
                <th className="py-2 pr-2">Media</th>
                <th className="py-2 pr-2">Visibility</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Tương tác</th>
                <th className="py-2 pr-2">Tạo lúc</th>
                <th className="py-2 pr-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    {loading ? "Đang tải dữ liệu..." : "Không có dữ liệu"}
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-2 font-medium text-slate-700">#{post.id}</td>
                    <td className="py-2 pr-2">
                      <div className="font-medium text-slate-700">{post.authorName || `User ${post.authorId}`}</div>
                      <div className="text-xs text-slate-500">ID: {post.authorId}</div>
                    </td>
                    <td className="py-2 pr-2">
                      <p className="line-clamp-3 max-w-[320px] whitespace-pre-wrap text-slate-700">
                        {post.content?.trim() || <span className="text-slate-400">[Không có nội dung]</span>}
                      </p>
                    </td>
                    <td className="py-2 pr-2">
                      {post.mediaUrl ? (
                        <a
                          href={post.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          {isVideoUrl(post.mediaUrl) ? "Video" : "Ảnh"}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Không có</span>
                      )}
                    </td>
                    <td className="py-2 pr-2">{post.visibility}</td>
                    <td className="py-2 pr-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          post.status === "DELETED"
                            ? "bg-slate-100 text-slate-600"
                            : post.status === "REJECTED"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-xs text-slate-600">
                      <div>{post.likeCount} lượt thích</div>
                      <div>{post.commentCount} bình luận</div>
                      <div>{post.shareCount} chia sẻ</div>
                    </td>
                    <td className="py-2 pr-2">{formatDate(post.createdAt)}</td>
                    <td className="py-2 pr-2">
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          disabled={post.status === "DELETED" || post.status === "REJECTED"}
                          onClick={() => void handleHidePost(post.id)}
                          className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                        >
                          Ẩn bài
                        </button>
                        <button
                          type="button"
                          disabled={post.status !== "REJECTED"}
                          onClick={() => void handleUnhidePost(post.id)}
                          className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          Bật lại
                        </button>
                        <button
                          type="button"
                          disabled={post.status === "DELETED"}
                          onClick={() => void handleDeletePost(post.id)}
                          className="rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          Xóa bài
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
