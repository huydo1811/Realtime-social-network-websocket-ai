"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import MediaPreview from "@/components/common/MediaPreview";
import UserLayout from "@/components/layout/UserLayout";
import PetAssistantSection from "@/components/pets/PetAssistantSection";
import PetDiagnosisSection from "@/components/pets/PetDiagnosisSection";
import PetHealthSection from "@/components/pets/PetHealthSection";
import PetWalkSection from "@/components/pets/PetWalkSection";
import PostCard from "@/components/user/profile/PostCard";
import type { FeedPost } from "@/components/user/profile/types";
import { petApi } from "@/lib/api/petApi";
import { postApi } from "@/lib/api/postApi";
import { getAuthTokens, clearAuthTokens } from "@/lib/api/authToken";
import { getUserIdFromAccessToken } from "@/lib/auth/jwtSubject";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { getPetBadgeMeta } from "@/lib/pets/petBadgeMeta";
import type { PetDto, PetSocialBadgeDto, PetSocialHealthSummaryDto, PetSocialPromptDto } from "@/types/pet";
import type { PetPostSocialSummaryDto, PostDto, PostVisibility } from "@/types/post";

type Tab = "posts" | "health" | "walk" | "assistant";
type TabMeta = {
  id: Tab;
  label: string;
  icon: JSX.Element;
};

const SPECIES_LABELS: Record<string, string> = {
  DOG: "Chó",
  CAT: "Mèo",
  BIRD: "Chim",
  RABBIT: "Thỏ",
  HAMSTER: "Hamster",
  FISH: "Cá",
  REPTILE: "Bò sát",
  OTHER: "Khác",
};

const GENDER_LABELS: Record<string, string> = {
  MALE: "Đực",
  FEMALE: "Cái",
  UNKNOWN: "Không rõ",
};

function toRelativeDate(input: string): string {
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return "Vừa xong";
  const diff = Date.now() - dt.getTime();
  if (diff < 60_000) return "Vừa xong";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
  return `${Math.floor(diff / 86_400_000)} ngày trước`;
}

function mapPostToFeed(post: PostDto): FeedPost {
  return {
    id: String(post.id),
    postId: post.id,
    authorId: post.authorId,
    authorName: post.authorName ?? undefined,
    authorAvatar: post.authorAvatarUrl ?? undefined,
    petId: post.petId ?? undefined,
    petName: post.petName ?? undefined,
    petAvatar: post.petAvatarUrl ?? undefined,
    content: post.content,
    mediaUrl: post.mediaUrl ?? undefined,
    visibility: post.visibility,
    status: post.status,
    createdAt: toRelativeDate(post.createdAt),
    likes: post.likeCount ?? 0,
    comments: post.commentCount ?? 0,
    shares: post.shareCount ?? 0,
  };
}

function formatDateTime(input?: string | null): string {
  if (!input) return "Chưa có";
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return input;
  return dt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

export default function PetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const petId = Number(params?.petId);

  const [pet, setPet] = useState<PetDto | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("posts");
  const [petSocial, setPetSocial] = useState<PetPostSocialSummaryDto | null>(null);
  const [healthSocial, setHealthSocial] = useState<PetSocialHealthSummaryDto | null>(null);
  const [quickPostContent, setQuickPostContent] = useState("");
  const [quickPostVisibility, setQuickPostVisibility] = useState<PostVisibility>("FRIENDS");
  const [creatingQuickPost, setCreatingQuickPost] = useState(false);
  const [quickPostNotice, setQuickPostNotice] = useState<string | null>(null);
  const [socialPrompts, setSocialPrompts] = useState<PetSocialPromptDto[]>([]);
  const [socialBadges, setSocialBadges] = useState<PetSocialBadgeDto[]>([]);
  const [socialBadgeFetchFailed, setSocialBadgeFetchFailed] = useState(false);
  const [uploadingPetAvatar, setUploadingPetAvatar] = useState(false);
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null);
  const [draftAvatarUrl, setDraftAvatarUrl] = useState<string | null>(null);
  const [draftAvatarName, setDraftAvatarName] = useState("");
  const [sharingBadgeKey, setSharingBadgeKey] = useState<string | null>(null);

  const actorId = useMemo(() => {
    const token = getAuthTokens()?.accessToken;
    return token ? getUserIdFromAccessToken(token) : null;
  }, []);

  const isOwner = pet != null && actorId != null && pet.ownerUserId === actorId;
  const unlockedBadges = socialBadges.filter((badge) => badge.unlocked);
  const lockedBadges = socialBadges.filter((badge) => !badge.unlocked);
  const tabs: TabMeta[] = [
    {
      id: "posts",
      label: "Bài viết",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      ),
    },
    {
      id: "health",
      label: "Sức khỏe",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h4l2-4 4 8 2-4h4" />
        </svg>
      ),
    },
    {
      id: "walk",
      label: "Đi dạo",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5 22l3-7 3 2 2-5 3 2 3 8" />
        </svg>
      ),
    },
    {
      id: "assistant",
      label: "Trợ lý & AI",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2M5 12H3m18 0h-2M6.5 6.5 5 5m14 14-1.5-1.5M6.5 17.5 5 19m14-14-1.5 1.5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
        </svg>
      ),
    },
  ];

  const load = useCallback(async () => {
    if (!Number.isFinite(petId)) {
      setError("Hồ sơ không hợp lệ");
      setLoading(false);
      return;
    }
    const tokens = getAuthTokens();
    if (!tokens?.accessToken) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [petData, postPage, postSummary, healthSummary, prompts, badgeResult] = await Promise.all([
        petApi.getById(petId),
        postApi.listPetPosts(petId, 0, 20),
        postApi.getPetSocialSummary(petId).catch(() => null),
        petApi.getSocialHealthSummary(petId).catch(() => null),
        petApi.getSocialPrompts(petId).catch(() => [] as PetSocialPromptDto[]),
        petApi
          .getSocialBadges(petId)
          .then((data) => ({ data, failed: false }))
          .catch(() => ({ data: [] as PetSocialBadgeDto[], failed: true })),
      ]);
      setPet(petData);
      setPosts(postPage.content.map(mapPostToFeed));
      setPetSocial(postSummary);
      setHealthSocial(healthSummary);
      setSocialPrompts(prompts);
      setSocialBadges(badgeResult.data);
      setSocialBadgeFetchFailed(badgeResult.failed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không thể tải hồ sơ thú cưng";
      if (msg.toLowerCase().includes("unauthorized")) {
        clearAuthTokens();
        router.replace("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [petId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createQuickPetPost() {
    const content = quickPostContent.trim();
    if (!content) {
      setQuickPostNotice("Nhập nội dung trước khi đăng.");
      return;
    }
    if (!pet) return;
    setCreatingQuickPost(true);
    setQuickPostNotice(null);
    try {
      const created = await postApi.create({
        content,
        visibility: quickPostVisibility,
        petId: pet.id,
      });
      setPosts((prev) => [mapPostToFeed(created), ...prev]);
      setQuickPostContent("");
      setQuickPostNotice("Đã đăng bài pet lên bảng tin.");
      const refreshedSummary = await postApi.getPetSocialSummary(pet.id).catch(() => null);
      if (refreshedSummary) setPetSocial(refreshedSummary);
    } catch (e) {
      setQuickPostNotice(e instanceof Error ? e.message : "Không thể đăng bài.");
    } finally {
      setCreatingQuickPost(false);
    }
  }

  async function handleChangePetAvatar(file?: File) {
    if (!file || !pet || !isOwner) return;
    setUploadingPetAvatar(true);
    setAvatarNotice(null);
    const localPreview = URL.createObjectURL(file);
    setDraftAvatarUrl(localPreview);
    setDraftAvatarName(file.name);
    try {
      const uploaded = await uploadToCloudinary(file);
      setDraftAvatarUrl(uploaded.secureUrl);
      URL.revokeObjectURL(localPreview);
      const updated = await petApi.update(pet.id, {
        name: pet.name,
        species: pet.species,
        breed: pet.breed ?? undefined,
        gender: pet.gender,
        birthDate: pet.birthDate ?? undefined,
        weightKg: pet.weightKg ?? undefined,
        avatarUrl: uploaded.secureUrl,
        bio: pet.bio ?? undefined,
        microchipCode: pet.microchipCode ?? undefined,
        visibility: pet.visibility,
        status: pet.status,
      });
      setPet(updated);
      setDraftAvatarUrl(null);
      setDraftAvatarName("");
      setAvatarNotice("Đã cập nhật ảnh thú cưng.");
    } catch (e) {
      setDraftAvatarUrl(null);
      setDraftAvatarName("");
      URL.revokeObjectURL(localPreview);
      setAvatarNotice(e instanceof Error ? e.message : "Không thể cập nhật ảnh thú cưng.");
    } finally {
      setUploadingPetAvatar(false);
    }
  }

  async function shareBadgeToFeed(badge: PetSocialBadgeDto) {
    if (!pet) return;
    setSharingBadgeKey(badge.key);
    setQuickPostNotice(null);
    try {
      const created = await postApi.create({
        content: badge.shareText,
        visibility: "FRIENDS",
        petId: pet.id,
      });
      setPosts((prev) => [mapPostToFeed(created), ...prev]);
      setQuickPostNotice(`Đã khoe huy hiệu "${badge.title}" lên bảng tin.`);
    } catch (e) {
      setQuickPostNotice(e instanceof Error ? e.message : "Không thể chia sẻ huy hiệu.");
    } finally {
      setSharingBadgeKey(null);
    }
  }

  return (
    <UserLayout>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Link href="/pets" className="mb-4 inline-block text-sm font-medium text-rose-600 hover:underline">
          ← Quay lại danh sách
        </Link>

        {loading ? (
          <p className="text-sm text-slate-500">Đang tải...</p>
        ) : error ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : pet ? (
          <>
            <div className="mb-6 overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-white via-rose-50/40 to-violet-50/40 shadow-sm">
              <div className="flex items-start gap-4 p-6">
                {(draftAvatarUrl || pet.avatarUrl) ? (
                  <Image
                    src={draftAvatarUrl || pet.avatarUrl!}
                    alt={pet.name}
                    width={112}
                    height={112}
                    className="h-28 w-28 rounded-2xl object-cover shadow-sm ring-2 ring-white"
                    unoptimized={Boolean(draftAvatarUrl)}
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-rose-100 text-2xl font-bold text-rose-600">
                    {pet.name[0]?.toUpperCase() ?? "P"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pet.name}</h1>
                    {unlockedBadges.slice(0, 3).map((badge) => {
                      const meta = getPetBadgeMeta(badge.key);
                      return (
                        <span
                          key={badge.key}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.colorClass}`}
                          title={badge.title}
                        >
                          <span>{meta.icon}</span>
                          <span>{meta.shortLabel}</span>
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {[SPECIES_LABELS[pet.species] ?? pet.species, pet.breed, pet.gender !== "UNKNOWN" ? GENDER_LABELS[pet.gender] : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {pet.bio ? <p className="mt-3 text-sm leading-relaxed text-slate-700">{pet.bio}</p> : null}
                  {pet.ownerName ? (
                    <p className="mt-2 inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-500">Chủ nuôi: {pet.ownerName}</p>
                  ) : null}
                  {isOwner ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          {uploadingPetAvatar ? "Đang cập nhật ảnh..." : "Đổi ảnh thú cưng"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => void handleChangePetAvatar(e.target.files?.[0])}
                            disabled={uploadingPetAvatar}
                          />
                        </label>
                        {avatarNotice ? <span className="text-xs text-slate-600">{avatarNotice}</span> : null}
                      </div>
                      {draftAvatarUrl ? (
                        <MediaPreview
                          url={draftAvatarUrl}
                          name={draftAvatarName || "Ảnh mới đang lưu..."}
                          compact
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm backdrop-blur">
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      tab === item.id
                        ? "bg-gradient-to-r from-rose-500 to-violet-500 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-500">Bài viết gắn thú cưng</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{petSocial?.totalPostCount ?? posts.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-500">Bài mới 7 ngày</p>
                <p className="mt-1 text-xl font-bold text-violet-600">{petSocial?.recentPost7dCount ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-500">Hồ sơ sức khỏe</p>
                <p className="mt-1 text-xl font-bold text-emerald-600">{healthSocial?.healthRecordCount ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-500">Đi dạo đã hoàn thành</p>
                <p className="mt-1 text-xl font-bold text-rose-600">{healthSocial?.walkFinishedCount ?? 0}</p>
              </div>
            </div>

            {tab === "posts" ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-amber-900">Huy hiệu cộng đồng của {pet.name}</p>
                    {socialBadges.length > 0 ? (
                      <span className="text-xs text-amber-700">
                        {unlockedBadges.length}/{socialBadges.length} đã mở khóa
                      </span>
                    ) : null}
                  </div>
                  {socialBadgeFetchFailed ? (
                    <div className="rounded-xl border border-amber-300 bg-white px-3 py-3 text-xs text-amber-800">
                      Chưa tải được dữ liệu huy hiệu. Hãy restart backend rồi tải lại trang.
                    </div>
                  ) : socialBadges.length === 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-white px-3 py-3 text-xs text-slate-600">
                      Hệ thống chưa có dữ liệu huy hiệu cho thú cưng này.
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {socialBadges.map((badge) => {
                        const meta = getPetBadgeMeta(badge.key);
                        return (
                          <div key={badge.key} className="rounded-xl border border-amber-200 bg-white px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{meta.icon}</span>
                              <p className="text-xs font-semibold text-slate-900">{badge.title}</p>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-600">{badge.description}</p>
                            <p className="mt-1 text-[11px] text-amber-700">{badge.progressText}</p>
                            {badge.unlocked ? (
                              isOwner ? (
                                <button
                                  type="button"
                                  onClick={() => void shareBadgeToFeed(badge)}
                                  disabled={sharingBadgeKey === badge.key}
                                  className="mt-2 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
                                >
                                  {sharingBadgeKey === badge.key ? "Đang đăng..." : "Khoe huy hiệu"}
                                </button>
                              ) : (
                                <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${meta.colorClass}`}>
                                  Đã mở khóa
                                </span>
                              )
                            ) : (
                              <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                                Chưa mở khóa
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {isOwner && lockedBadges.length > 0 ? (
                  <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
                    <p className="text-sm font-semibold text-violet-900">Thử thách cộng đồng tuần này</p>
                    <div className="mt-2 space-y-2">
                      {lockedBadges.slice(0, 2).map((badge) => {
                        const meta = getPetBadgeMeta(badge.key);
                        return (
                          <div key={`challenge-${badge.key}`} className="flex items-center justify-between gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-900">{meta.icon} {badge.title}</p>
                              <p className="text-[11px] text-violet-700">{badge.progressText}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setTab(badge.key === "walk_explorer" ? "walk" : "health")}
                              className="rounded-full border border-violet-200 px-3 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-50"
                            >
                              Làm ngay
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {isOwner ? (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-sky-900">Đăng nhanh cho {pet.name}</p>
                      <p className="text-xs text-sky-700">Bài sẽ tự gắn thẻ thú cưng và hiện ở Bảng tin + tab Bài viết</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(socialPrompts.length > 0 ? socialPrompts : [
                        {
                          key: "walk",
                          title: "Mẫu đi dạo",
                          content: `🐾 ${pet.name} vừa hoàn thành một buổi đi dạo rất năng lượng!`,
                        },
                        {
                          key: "health",
                          title: "Mẫu sức khỏe",
                          content: `🩺 Cập nhật sức khỏe của ${pet.name}: ${healthSocial?.healthRecordCount ?? 0} mốc đã lưu, ${healthSocial?.reminderPendingCount ?? 0} lịch chăm sóc đang chờ.`,
                        },
                      ]).map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setQuickPostContent(item.content)}
                          className="rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                        >
                          {item.title}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setTab("health")}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Mở Sổ sức khỏe
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab("walk")}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Mở Đi dạo
                      </button>
                    </div>
                    <textarea
                      value={quickPostContent}
                      onChange={(e) => setQuickPostContent(e.target.value)}
                      rows={4}
                      className="mt-3 w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-100"
                      placeholder={`Viết cập nhật về ${pet.name} để chia sẻ với bạn bè...`}
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs text-slate-600">
                        Quyền xem
                        <select
                          value={quickPostVisibility}
                          onChange={(e) => setQuickPostVisibility(e.target.value as PostVisibility)}
                          className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1"
                        >
                          <option value="PUBLIC">Công khai</option>
                          <option value="FRIENDS">Bạn bè</option>
                          <option value="PRIVATE">Riêng tư</option>
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => void createQuickPetPost()}
                        disabled={creatingQuickPost}
                        className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                      >
                        {creatingQuickPost ? "Đang đăng..." : "Đăng lên bảng tin"}
                      </button>
                    </div>
                    {quickPostNotice ? <p className="mt-2 text-xs text-sky-800">{quickPostNotice}</p> : null}
                    <p className="mt-1 text-[11px] text-slate-500">
                      Bài gần nhất: {formatDateTime(petSocial?.latestPostAt)}
                    </p>
                  </div>
                ) : null}
                {posts.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                    Chưa có bài viết nào gắn với thú cưng này.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        liked={false}
                        onToggleLike={() => {}}
                        onOpen={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : tab === "health" ? (
              <PetHealthSection petId={petId} isOwner={isOwner} />
            ) : tab === "walk" ? (
              <PetWalkSection petId={petId} isOwner={isOwner} />
            ) : (
              <div className="space-y-6">
                <PetAssistantSection petId={petId} petName={pet?.name ?? "Thú cưng"} species={pet?.species ?? "OTHER"} isOwner={isOwner} />
                <PetDiagnosisSection petId={petId} isOwner={isOwner} />
              </div>
            )}
          </>
        ) : null}
      </div>
    </UserLayout>
  );
}
