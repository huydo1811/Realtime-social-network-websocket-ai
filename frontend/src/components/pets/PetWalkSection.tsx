"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { petApi } from "@/lib/api/petApi";
import { postApi } from "@/lib/api/postApi";
import { getUserById } from "@/lib/api/userApi";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { getAuthTokens } from "@/lib/api/authToken";
import { getUserIdFromAccessToken } from "@/lib/auth/jwtSubject";
import { initChatSocket, subscribePetWalkUser } from "@/lib/socket/chatSocket";
import MediaPreview from "@/components/common/MediaPreview";
import type {
  CreatePetWalkMeetupPayload,
  CreatePetWalkSessionPayload,
  PetWalkMeetupRequestDto,
  PetWalkSessionDto,
} from "@/types/petWalk";
import type { PetWalkRealtimeEvent } from "@/types/petWalkRealtime";
import type { PetVisibility } from "@/types/pet";

type Tab = "map" | "sessions" | "meetups";
type ShareTone = "friendly" | "expert" | "fun";
type ShareTemplate = "diary" | "alert" | "milestone";
type WalkShareDraft = {
  sessionId: number;
  title: string;
  content: string;
  visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
};

type Props = {
  petId: number;
  isOwner: boolean;
};

const VISIBILITY_OPTIONS: { value: PetVisibility; label: string }[] = [
  { value: "PUBLIC", label: "Công khai" },
  { value: "FRIENDS", label: "Bạn bè" },
  { value: "PRIVATE", label: "Riêng tư" },
];

function formatDateTime(input: string) {
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return input;
  return dt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function toFixedOr(input: number | null | undefined, fraction = 4) {
  if (input == null || Number.isNaN(input)) return "—";
  return input.toFixed(fraction);
}

function formatWalkDuration(startedAt: string, endedAt?: string | null) {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "—";
  const seconds = Math.floor((end - start) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const earthRadiusKm = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const start =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(start), Math.sqrt(1 - start));
}

function normalizeDateIso(input: unknown): string {
  if (typeof input === "string" && input.trim()) return input;
  if (typeof input === "number" && Number.isFinite(input)) {
    return new Date(input).toISOString();
  }
  if (input && typeof input === "object") {
    const record = input as { seconds?: number; nanos?: number };
    if (typeof record.seconds === "number") {
      return new Date(record.seconds * 1000 + (record.nanos ?? 0) / 1e6).toISOString();
    }
  }
  return new Date().toISOString();
}

function normalizePetTag(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

const PetWalkMap = dynamic(() => import("@/components/pets/PetWalkMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-400">
      <span className="flex items-center gap-2">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Đang tải bản đồ...
      </span>
    </div>
  ),
});

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PLANNED: "bg-amber-100 text-amber-700",
  FINISHED: "bg-slate-100 text-slate-500",
  CANCELLED: "bg-rose-100 text-rose-600",
};
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Đang đi dạo",
  PLANNED: "Đã lên lịch",
  FINISHED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
};

const MEETUP_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  DECLINED: "bg-rose-100 text-rose-600",
  CANCELLED: "bg-slate-100 text-slate-400",
};
const MEETUP_LABELS: Record<string, string> = {
  PENDING: "Đang chờ",
  ACCEPTED: "Đã đồng ý",
  DECLINED: "Đã từ chối",
  CANCELLED: "Đã hủy",
};
const VISIBILITY_LABELS: Record<PetVisibility, string> = {
  PUBLIC: "Công khai",
  FRIENDS: "Bạn bè",
  PRIVATE: "Riêng tư",
};

export default function PetWalkSection({ petId, isOwner }: Props) {
  const [tab, setTab] = useState<Tab>("map");
  const [sessions, setSessions] = useState<PetWalkSessionDto[]>([]);
  const [joinedSessions, setJoinedSessions] = useState<PetWalkSessionDto[]>([]);
  const [nearbySessions, setNearbySessions] = useState<PetWalkSessionDto[]>([]);
  const [meetups, setMeetups] = useState<PetWalkMeetupRequestDto[]>([]);
  const [sentMeetups, setSentMeetups] = useState<PetWalkMeetupRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharingSessionId, setSharingSessionId] = useState<number | null>(null);
  const [shareTone, setShareTone] = useState<ShareTone>("friendly");
  const [shareTemplate, setShareTemplate] = useState<ShareTemplate>("diary");
  const [usernamesByUserId, setUsernamesByUserId] = useState<Record<number, string>>({});
  const [displayNamesByUserId, setDisplayNamesByUserId] = useState<Record<number, string>>({});
  const [finishShareSession, setFinishShareSession] = useState<PetWalkSessionDto | null>(null);
  const [finishShareText, setFinishShareText] = useState("");
  const [finishShareMediaUrl, setFinishShareMediaUrl] = useState<string | undefined>(undefined);
  const [finishShareMediaName, setFinishShareMediaName] = useState("");
  const [finishShareUploading, setFinishShareUploading] = useState(false);
  const [finishSharePosting, setFinishSharePosting] = useState(false);
  const [finishShareVisibility, setFinishShareVisibility] = useState<"PUBLIC" | "FRIENDS" | "PRIVATE">("FRIENDS");
  const [walkShareDraft, setWalkShareDraft] = useState<WalkShareDraft | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const [walkForm, setWalkForm] = useState<CreatePetWalkSessionPayload>({
    startLatitude: 10.762622,
    startLongitude: 106.660172,
    visibility: "PUBLIC",
    routeName: "",
    note: "",
  });

  const [searchForm, setSearchForm] = useState({
    latitude: 10.762622,
    longitude: 106.660172,
    radiusKm: 5,
  });

  const actorId = useMemo(() => {
    const token = getAuthTokens()?.accessToken;
    return token ? getUserIdFromAccessToken(token) : null;
  }, []);

  const activeSessions = useMemo(
    () => [...sessions, ...joinedSessions].filter((s) => s.status === "ACTIVE"),
    [joinedSessions, sessions]
  );

  const allSessions = useMemo(() => {
    const map = new Map<number, PetWalkSessionDto>();
    sessions.forEach((session) => map.set(session.id, session));
    joinedSessions.forEach((session) => {
      if (!map.has(session.id)) map.set(session.id, session);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }, [joinedSessions, sessions]);

  const latestSentMeetupByWalkId = useMemo(() => {
    const map = new Map<number, PetWalkMeetupRequestDto>();
    sentMeetups.forEach((meetup) => {
      if (!map.has(meetup.walkSessionId)) {
        map.set(meetup.walkSessionId, meetup);
      }
    });
    return map;
  }, [sentMeetups]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ownSessions, incomingMeetups, outgoingMeetups, joined] = await Promise.all([
        isOwner ? petApi.listWalks(petId).catch(() => [] as PetWalkSessionDto[]) : Promise.resolve([] as PetWalkSessionDto[]),
        isOwner
          ? petApi.listWalkMeetups(petId).catch(() => [] as PetWalkMeetupRequestDto[])
          : Promise.resolve([] as PetWalkMeetupRequestDto[]),
        petApi.listSentWalkMeetups().catch(() => [] as PetWalkMeetupRequestDto[]),
        petApi.listJoinedWalks().catch(() => [] as PetWalkSessionDto[]),
      ]);
      setSessions(ownSessions);
      setMeetups(incomingMeetups);
      setSentMeetups(outgoingMeetups);
      setJoinedSessions(joined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu đi dạo");
    } finally {
      setLoading(false);
    }
  }, [isOwner, petId]);

  const requestCurrentLocation = useCallback(
    async (searchAfterUpdate = true) => {
      if (!navigator.geolocation) {
        setGeoMessage("Trình duyệt không hỗ trợ định vị.");
        return;
      }
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setWalkForm((form) => ({ ...form, startLatitude: lat, startLongitude: lon }));
          setSearchForm((form) => ({ ...form, latitude: lat, longitude: lon }));
          setGeoMessage("Đã cập nhật vị trí hiện tại.");
          if (searchAfterUpdate) {
            try {
              const result = await petApi.listNearbyWalks(lat, lon, searchForm.radiusKm);
              setNearbySessions(result);
              setGeoMessage(
                result.length
                  ? `Tìm thấy ${result.length} phiên đi dạo quanh đây.`
                  : "Chưa có phiên đi dạo công khai nào gần đây."
              );
            } catch {
              setError("Không thể tải phiên đi dạo gần đây.");
            }
          }
          setGeoLoading(false);
        },
        () => {
          setGeoMessage("Không lấy được vị trí. Vui lòng cấp quyền định vị.");
          setGeoLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    },
    [searchForm.radiusKm]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void requestCurrentLocation(true);
  }, [requestCurrentLocation]);

  const searchNearby = useCallback(async () => {
    setError(null);
    try {
      const result = await petApi.listNearbyWalks(searchForm.latitude, searchForm.longitude, searchForm.radiusKm);
      setNearbySessions(result);
      if (!result.length) setGeoMessage("Chưa có phiên đi dạo công khai nào trong bán kính này.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải phiên đi dạo gần đây.");
    }
  }, [searchForm.latitude, searchForm.longitude, searchForm.radiusKm]);

  const handlePetWalkRealtime = useCallback(
    (ev: PetWalkRealtimeEvent) => {
      if (ev.eventName === "pet.walk.meetup.accepted" || ev.eventName === "pet.walk.meetup.declined") {
        setMeetups((prev) =>
          prev.map((item) =>
            item.id === ev.meetupId
              ? {
                  ...item,
                  status: ev.eventName === "pet.walk.meetup.accepted" ? "ACCEPTED" : "DECLINED",
                }
              : item
          )
        );
        setSentMeetups((prev) =>
          prev.map((item) =>
            item.id === ev.meetupId
              ? {
                  ...item,
                  status: ev.eventName === "pet.walk.meetup.accepted" ? "ACCEPTED" : "DECLINED",
                }
              : item
          )
        );
      }
      if (ev.eventName === "pet.walk.session.finished" && ev.walkSessionId) {
        const endedAt = normalizeDateIso(ev.createdAt);
        const patchSession = (session: PetWalkSessionDto) =>
          session.id === ev.walkSessionId
            ? { ...session, status: "FINISHED" as const, endedAt }
            : session;
        setSessions((prev) => prev.map(patchSession));
        setJoinedSessions((prev) => prev.map(patchSession));
        setNearbySessions((prev) =>
          prev.map(patchSession).filter((session) => session.status === "ACTIVE")
        );
        if (actorId != null && ev.actorUserId !== actorId) {
          setNotice("Phiên đi dạo chung đã được kết thúc.");
        }
      }
      void load();
      void searchNearby();
    },
    [actorId, load, searchNearby]
  );

  useEffect(() => {
    if (actorId == null) return;
    initChatSocket();
    const unsub = subscribePetWalkUser(actorId, handlePetWalkRealtime);
    return () => unsub();
  }, [actorId, handlePetWalkRealtime]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.hidden) return;
      void load();
      void searchNearby();
    }, 10000);
    return () => window.clearInterval(interval);
  }, [load, searchNearby]);

  async function submitWalk(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await petApi.createWalk(petId, {
        startLatitude: walkForm.startLatitude,
        startLongitude: walkForm.startLongitude,
        visibility: walkForm.visibility,
        routeName: walkForm.routeName?.trim() || undefined,
        note: walkForm.note?.trim() || undefined,
      });
      setSessions((prev) => [created, ...prev]);
      setShowCreateForm(false);
      setWalkForm((f) => ({ ...f, routeName: "", note: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo phiên đi dạo");
    } finally {
      setSaving(false);
    }
  }

  async function finishWalk(session: PetWalkSessionDto) {
    try {
      const resolveEndPoint = async () => {
        if (!navigator.geolocation) {
          return { latitude: searchForm.latitude, longitude: searchForm.longitude };
        }
        return await new Promise<{ latitude: number; longitude: number }>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) =>
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
            () => resolve({ latitude: searchForm.latitude, longitude: searchForm.longitude }),
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      };
      const endPoint = await resolveEndPoint();
      const finished = await petApi.finishWalk(petId, session.id, {
        endLatitude: endPoint.latitude,
        endLongitude: endPoint.longitude,
      });
      setSessions((prev) => prev.map((item) => (item.id === session.id ? finished : item)));
      setJoinedSessions((prev) => prev.map((item) => (item.id === session.id ? finished : item)));
      setNearbySessions((prev) => prev.filter((item) => item.id !== session.id));
      setNotice("Đã kết thúc phiên đi dạo.");
      setFinishShareSession(finished);
      setFinishShareText(buildWalkShareText(finished));
      setFinishShareMediaUrl(undefined);
      setFinishShareMediaName("");
      setFinishShareVisibility("FRIENDS");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kết thúc phiên đi dạo");
    }
  }

  async function submitMeetup(walkId: number, draft?: CreatePetWalkMeetupPayload) {
    const payload = draft ?? {};
    try {
      const created = await petApi.createWalkMeetup(walkId, {
        message: payload.message?.trim() || undefined,
        meetupLatitude: payload.meetupLatitude,
        meetupLongitude: payload.meetupLongitude,
      });
      setSentMeetups((prev) => [created, ...prev]);
      setNotice("Đã gửi lời mời tham gia phiên đi dạo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi lời mời gặp gỡ");
    }
  }

  async function respondMeetup(meetupId: number, accept: boolean) {
    try {
      const updated = accept ? await petApi.acceptWalkMeetup(meetupId) : await petApi.declineWalkMeetup(meetupId);
      setMeetups((prev) => prev.map((item) => (item.id === meetupId ? updated : item)));
      if (accept) {
        const joined = await petApi.listJoinedWalks().catch(() => [] as PetWalkSessionDto[]);
        setJoinedSessions(joined);
        setNotice("Đã chấp nhận lời mời. Hai bên đang tham gia chung một phiên đi dạo.");
      } else {
        setNotice("Đã từ chối lời mời.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể phản hồi lời mời");
    }
  }

  const acceptedPartnerIdsByWalkId = useMemo(() => {
    const map = new Map<number, number[]>();
    const pushId = (walkId: number, userId: number) => {
      const list = map.get(walkId) ?? [];
      if (!list.includes(userId)) list.push(userId);
      map.set(walkId, list);
    };
    meetups.forEach((item) => {
      if (item.status !== "ACCEPTED") return;
      pushId(item.walkSessionId, item.requesterUserId);
    });
    sentMeetups.forEach((item) => {
      if (item.status !== "ACCEPTED") return;
      pushId(item.walkSessionId, item.targetUserId);
    });
    return map;
  }, [meetups, sentMeetups]);

  const acceptedPetNamesByWalkId = useMemo(() => {
    const map = new Map<number, string[]>();
    const pushPet = (walkId: number, petName?: string | null) => {
      const clean = petName?.trim();
      if (!clean) return;
      const list = map.get(walkId) ?? [];
      if (!list.includes(clean)) list.push(clean);
      map.set(walkId, list);
    };
    meetups.forEach((item) => {
      if (item.status !== "ACCEPTED") return;
      pushPet(item.walkSessionId, item.petName);
    });
    sentMeetups.forEach((item) => {
      if (item.status !== "ACCEPTED") return;
      pushPet(item.walkSessionId, item.petName);
    });
    return map;
  }, [meetups, sentMeetups]);

  useEffect(() => {
    const uniqueIds = new Set<number>();
    meetups.forEach((item) => {
      if (item.requesterUserId) uniqueIds.add(item.requesterUserId);
    });
    sentMeetups.forEach((item) => {
      if (item.targetUserId) uniqueIds.add(item.targetUserId);
    });
    if (!uniqueIds.size) return;

    let cancelled = false;
    void Promise.all(
      Array.from(uniqueIds).map(async (id) => {
        if (displayNamesByUserId[id] || usernamesByUserId[id]) return null;
        try {
          const profile = await getUserById(String(id));
          return {
            id,
            fullName: profile.fullName?.trim() || undefined,
            username: profile.username?.trim() || undefined,
          };
        } catch {
          return null;
        }
      })
    ).then((items) => {
      if (cancelled) return;
      const nextNames: Record<number, string> = {};
      const nextUsernames: Record<number, string> = {};
      items.forEach((item) => {
        if (!item) return;
        if (item.fullName) nextNames[item.id] = item.fullName;
        if (item.username) nextUsernames[item.id] = item.username;
      });
      if (Object.keys(nextNames).length) {
        setDisplayNamesByUserId((prev) => ({ ...prev, ...nextNames }));
      }
      if (Object.keys(nextUsernames).length) {
        setUsernamesByUserId((prev) => ({ ...prev, ...nextUsernames }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [meetups, sentMeetups, displayNamesByUserId, usernamesByUserId]);

  function formatPartnerTags(walkId: number): string {
    const ids = acceptedPartnerIdsByWalkId.get(walkId) ?? [];
    const tags = ids.map((id) => {
      const fullName = displayNamesByUserId[id];
      if (fullName) return fullName;
      const username = usernamesByUserId[id];
      return username ? `@${username}` : `User #${id}`;
    });
    return tags.join(", ");
  }

  function formatPartnerPetTags(walkId: number): string {
    const names = acceptedPetNamesByWalkId.get(walkId) ?? [];
    return names.map((name) => `@pet_${normalizePetTag(name)}`).join(" ");
  }

  function buildWalkShareText(session: PetWalkSessionDto): string {
    const distance = distanceKm(
      session.startLatitude,
      session.startLongitude,
      session.currentLatitude,
      session.currentLongitude
    );
    const partnerTags = formatPartnerTags(session.id);
    const partnerPetTags = formatPartnerPetTags(session.id);
    const base =
      shareTemplate === "alert"
        ? `📣 Vừa hoàn thành phiên đi dạo: ${session.routeName ?? "Route tự do"}`
        : shareTemplate === "milestone"
          ? `🏅 Thành tích đi dạo mới của ${session.petName ?? "pet"}`
          : `📔 Nhật ký đi dạo của ${session.petName ?? "pet"}`;
    const toneLine =
      shareTone === "expert"
        ? "Dữ liệu vận động đã được cập nhật vào hồ sơ sức khỏe."
        : shareTone === "fun"
          ? "Một buổi cardio vui vẻ cho boss 🐾"
          : "Hôm nay tụi mình vừa có một buổi đi dạo rất ổn.";

    return [
      base,
      toneLine,
      `Quãng đường: ${distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`}`,
      `Thời gian: ${formatWalkDuration(session.startedAt, session.endedAt)}`,
      partnerTags ? `Đi dạo cùng: ${partnerTags}` : null,
      partnerPetTags ? `Pet tham gia: ${partnerPetTags}` : null,
      "#PetWalk #PetSocial",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function shareWalkSession(session: PetWalkSessionDto) {
    setWalkShareDraft({
      sessionId: session.id,
      title: "Xem trước chia sẻ phiên đi dạo",
      content: buildWalkShareText(session),
      visibility: "FRIENDS",
    });
  }

  async function confirmWalkShareDraft() {
    if (!walkShareDraft) return;
    setSharingSessionId(walkShareDraft.sessionId);
    setError(null);
    try {
      await postApi.create({
        content: walkShareDraft.content,
        visibility: walkShareDraft.visibility,
        petId,
      });
      setNotice("Đã chia sẻ phiên đi dạo lên bảng tin.");
      setWalkShareDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể chia sẻ phiên đi dạo.");
    } finally {
      setSharingSessionId(null);
    }
  }

  async function handleFinishShareMedia(file?: File) {
    if (!file) return;
    setFinishShareUploading(true);
    setError(null);
    try {
      const uploaded = await uploadToCloudinary(file);
      setFinishShareMediaUrl(uploaded.secureUrl);
      setFinishShareMediaName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải ảnh/video.");
    } finally {
      setFinishShareUploading(false);
    }
  }

  async function submitFinishShare() {
    if (!finishShareSession) return;
    const content = finishShareText.trim();
    if (!content && !finishShareMediaUrl) return;
    setFinishSharePosting(true);
    setError(null);
    try {
      await postApi.create({
        content,
        mediaUrl: finishShareMediaUrl,
        visibility: finishShareVisibility,
        petId,
      });
      setNotice("Đã đăng bài đi dạo lên bảng tin.");
      setFinishShareSession(null);
      setFinishShareText("");
      setFinishShareMediaUrl(undefined);
      setFinishShareMediaName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng bài đi dạo.");
    } finally {
      setFinishSharePosting(false);
    }
  }

  const mapCenter = nearbySessions[0] ?? activeSessions[0];
  const activeCount = nearbySessions.filter((s) => s.status === "ACTIVE").length;
  const pendingIncomingCount = meetups.filter((m) => m.status === "PENDING").length;
  const pendingOutgoingCount = sentMeetups.filter((m) => m.status === "PENDING").length;
  const tabIcons: Record<Tab, JSX.Element> = {
    map: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z" />
      </svg>
    ),
    sessions: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
      </svg>
    ),
    meetups: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0m8 0a6 6 0 0 0-9-5.2" />
      </svg>
    ),
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "map", label: "Bản đồ" },
    { id: "sessions", label: "Phiên đi dạo", count: allSessions.length },
    { id: "meetups", label: "Lời mời", count: pendingIncomingCount + pendingOutgoingCount },
  ];

  return (
    <div className="space-y-5">

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {notice}
        </div>
      ) : null}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">Pet walk</p>
          <h2 className="mt-0.5 text-2xl font-semibold text-slate-900">Đi dạo cùng pet</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* GPS status badge */}
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${geoLoading ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${geoLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            {geoLoading ? "Định vị..." : geoMessage ?? "GPS ready"}
          </div>

          {/* Location refresh */}
          <button
            type="button"
            onClick={() => void requestCurrentLocation(true)}
            disabled={geoLoading}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-400 hover:text-slate-700 disabled:cursor-not-allowed"
            title="Cập nhật vị trí"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`mr-1 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all last:mr-0 ${
              tab === t.id
                ? "bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            {tabIcons[t.id]}
            {t.label}
            {t.count !== undefined && t.count > 0 ? (
              <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${tab === t.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                {t.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Template chia sẻ</span>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <span>Template</span>
          <select
            value={shareTemplate}
            onChange={(e) => setShareTemplate(e.target.value as ShareTemplate)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
          >
            <option value="diary">Nhật ký</option>
            <option value="alert">Thông báo</option>
            <option value="milestone">Thành tích</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <span>Giọng văn</span>
          <select
            value={shareTone}
            onChange={(e) => setShareTone(e.target.value as ShareTone)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
          >
            <option value="friendly">Thân thiện</option>
            <option value="expert">Chuyên nghiệp</option>
            <option value="fun">Vui vẻ</option>
          </select>
        </label>
      </div>

      {/* ── MAP TAB ── */}
      {tab === "map" && (
        <div className="space-y-4">
          {/* Map container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative">
              <PetWalkMap
                centerLatitude={searchForm.latitude}
                centerLongitude={searchForm.longitude}
                radiusKm={searchForm.radiusKm}
                nearbySessions={nearbySessions}
                geoLoading={geoLoading}
                geoMessage={geoMessage}
                onRefreshLocation={() => void requestCurrentLocation(true)}
              />
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Quanh đây", value: nearbySessions.length, sub: "phiên công khai" },
              { label: "Đang hoạt động", value: activeCount, sub: "session live" },
              { label: "Bán kính", value: searchForm.radiusKm, sub: "km", unit: true },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center">
                <p className="text-2xl font-semibold text-slate-900">
                  {stat.unit ? stat.value : stat.value}
                  {stat.unit && <span className="text-sm font-normal text-slate-400"> km</span>}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{stat.label}</p>
                <p className="text-[11px] text-slate-400">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Nearby sessions list */}
          {nearbySessions.length > 0 && (
            <div className="space-y-2">
              <p className="px-1 text-sm font-semibold text-slate-700">Gần bạn nhất</p>
              <div className="space-y-2">
                {nearbySessions.slice(0, 5).map((session) => {
                  const dist = mapCenter
                    ? distanceKm(searchForm.latitude, searchForm.longitude, session.currentLatitude, session.currentLongitude)
                    : null;
                  const sentMeetup = latestSentMeetupByWalkId.get(session.id);
                  const canInvite =
                    session.status === "ACTIVE" &&
                    actorId != null &&
                    session.createdByUserId !== actorId &&
                    sentMeetup?.status !== "PENDING" &&
                    sentMeetup?.status !== "ACCEPTED";
                  return (
                    <div key={session.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-slate-900">{session.petName ?? `Thú cưng #${session.petId}`}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[session.status] ?? "bg-slate-100 text-slate-500"}`}>
                            {STATUS_LABELS[session.status] ?? session.status}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {session.routeName ?? "Đi dạo tự do"} · {VISIBILITY_LABELS[session.visibility]}
                        </p>
                        {sentMeetup ? (
                          <p className={`mt-1 text-[11px] font-medium ${
                            sentMeetup.status === "ACCEPTED"
                              ? "text-emerald-600"
                              : sentMeetup.status === "PENDING"
                                ? "text-amber-600"
                                : sentMeetup.status === "DECLINED"
                                  ? "text-rose-600"
                                  : "text-slate-500"
                          }`}>
                            Lời mời của bạn: {MEETUP_LABELS[sentMeetup.status] ?? sentMeetup.status}
                          </p>
                        ) : null}
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        {dist != null && (
                          <p className="text-sm font-semibold text-rose-500">{dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`}</p>
                        )}
                        <button
                          type="button"
                          disabled={!canInvite}
                          onClick={() => {
                            const draft: CreatePetWalkMeetupPayload = {
                              message: `Xin tham gia đi dạo cùng ${session.petName ?? "pet của bạn"}!`,
                              meetupLatitude: searchForm.latitude,
                              meetupLongitude: searchForm.longitude,
                            };
                            void submitMeetup(session.id, draft);
                          }}
                          className="mt-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {sentMeetup?.status === "PENDING"
                            ? "Đã mời"
                            : sentMeetup?.status === "ACCEPTED"
                              ? "Đã tham gia"
                              : "Mời tham gia"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {nearbySessions.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="mt-3 font-medium text-slate-500">Chưa có phiên đi dạo gần đây</p>
              <p className="mt-1 text-sm text-slate-400">Thử tăng bán kính tìm kiếm hoặc chờ người khác bắt đầu phiên.</p>
            </div>
          )}
        </div>
      )}

      {/* ── SESSIONS TAB ── */}
      {tab === "sessions" && (
        <div className="space-y-4">
          {finishShareSession && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50/50 px-4 py-4">
              <p className="mb-2 text-sm font-semibold text-violet-900">Đăng nhanh sau khi kết thúc phiên đi dạo</p>
              <textarea
                value={finishShareText}
                onChange={(e) => setFinishShareText(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-violet-100"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  {finishShareUploading ? "Đang tải..." : "Thêm ảnh/video"}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => void handleFinishShareMedia(e.target.files?.[0])}
                  />
                </label>
                {finishShareMediaName ? <span className="text-xs text-slate-500">{finishShareMediaName}</span> : null}
                <label className="text-xs text-slate-600">
                  Quyền xem
                  <select
                    value={finishShareVisibility}
                    onChange={(e) => setFinishShareVisibility(e.target.value as "PUBLIC" | "FRIENDS" | "PRIVATE")}
                    className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                  >
                    <option value="PUBLIC">Công khai</option>
                    <option value="FRIENDS">Bạn bè</option>
                    <option value="PRIVATE">Riêng tư</option>
                  </select>
                </label>
              </div>
              {finishShareMediaUrl ? (
                <div className="mt-2">
                  <MediaPreview
                    url={finishShareMediaUrl}
                    name={finishShareMediaName}
                    onClear={() => {
                      setFinishShareMediaUrl(undefined);
                      setFinishShareMediaName("");
                    }}
                    compact
                  />
                </div>
              ) : null}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void submitFinishShare()}
                  disabled={finishSharePosting || finishShareUploading}
                  className="rounded-full bg-violet-500 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-600 disabled:opacity-60"
                >
                  {finishSharePosting ? "Đang đăng..." : "Đăng lên bảng tin"}
                </button>
                <button
                  type="button"
                  onClick={() => setFinishShareSession(null)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          )}

          {/* Create form */}
          {isOwner && (
            <div className="rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setShowCreateForm((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">Tạo phiên đi dạo mới</p>
                    <p className="text-sm text-slate-500">Bắt đầu ghi lại lịch sử đi dạo cho pet</p>
                  </div>
                </div>
                <svg className={`h-5 w-5 text-slate-400 transition-transform ${showCreateForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCreateForm && (
                <form onSubmit={(e) => void submitWalk(e)} className="border-t border-slate-100 px-5 py-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Tên route</span>
                      <input
                        value={walkForm.routeName ?? ""}
                        onChange={(e) => setWalkForm((form) => ({ ...form, routeName: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                        placeholder="VD: Công viên Tao Đàn"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Vĩ độ bắt đầu</span>
                      <input
                        type="number"
                        step="0.000001"
                        value={walkForm.startLatitude}
                        onChange={(e) => setWalkForm((form) => ({ ...form, startLatitude: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Kinh độ bắt đầu</span>
                      <input
                        type="number"
                        step="0.000001"
                        value={walkForm.startLongitude}
                        onChange={(e) => setWalkForm((form) => ({ ...form, startLongitude: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Quyền hiển thị</span>
                      <select
                        value={walkForm.visibility}
                        onChange={(e) => setWalkForm((form) => ({ ...form, visibility: e.target.value as PetVisibility }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                      >
                        {VISIBILITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Ghi chú</span>
                    <textarea
                      rows={2}
                      value={walkForm.note ?? ""}
                      onChange={(e) => setWalkForm((form) => ({ ...form, note: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                      placeholder="VD: Đi dạo 20 phút quanh hồ"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-full bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
                    >
                      {saving ? "Đang lưu..." : "Tạo phiên đi dạo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Session list */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="h-6 w-6 animate-spin text-slate-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          ) : allSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-3 font-medium text-slate-500">Chưa có phiên đi dạo nào</p>
              <p className="mt-1 text-sm text-slate-400">Tạo phiên mới để bắt đầu theo dõi.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allSessions.map((session) => {
                const distance = distanceKm(
                  session.startLatitude,
                  session.startLongitude,
                  session.currentLatitude,
                  session.currentLongitude
                );
                const isJoinedSession = actorId != null && session.createdByUserId !== actorId;
                const partnerTags = formatPartnerTags(session.id);
                const partnerPetTags = formatPartnerPetTags(session.id);
                return (
                <div key={session.id} className="group rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition hover:border-slate-300 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-slate-900">{session.routeName ?? "Phiên đi dạo"}</p>
                        {isJoinedSession ? (
                          <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                            ĐÃ THAM GIA
                          </span>
                        ) : null}
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[session.status] ?? "bg-slate-100 text-slate-500"}`}>
                          {STATUS_LABELS[session.status] ?? session.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(session.startedAt)}</p>
                      {session.note ? <p className="mt-1 text-sm text-slate-500">{session.note}</p> : null}
                      {partnerTags ? <p className="mt-1 text-xs font-medium text-indigo-600">Đi dạo cùng: {partnerTags}</p> : null}
                      {partnerPetTags ? <p className="mt-1 text-xs font-medium text-fuchsia-600">Pet tham gia: {partnerPetTags}</p> : null}
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                        <span>Quãng đường: {distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(2)} km`}</span>
                        <span>•</span>
                        <span>Thời gian: {formatWalkDuration(session.startedAt, session.endedAt)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-slate-400">{toFixedOr(session.currentLatitude)}, {toFixedOr(session.currentLongitude)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void shareWalkSession(session)}
                      disabled={sharingSessionId === session.id}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      {sharingSessionId === session.id ? "Đang chia sẻ..." : "Chia sẻ lên bảng tin"}
                    </button>
                    {isOwner && !isJoinedSession && session.status === "ACTIVE" && (
                      <button
                        type="button"
                        onClick={() => void finishWalk(session)}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      >
                        Kết thúc phiên
                      </button>
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      )}

      {/* ── MEETUPS TAB ── */}
      {tab === "meetups" && (
        <div className="space-y-2">
          {isOwner ? (
            <>
              <p className="px-1 text-sm font-semibold text-slate-700">Lời mời nhận được</p>
              {meetups.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                  <p className="font-medium text-slate-500">Chưa có lời mời đến phiên của bạn.</p>
                </div>
              ) : (
                meetups.map((meetup) => (
                  <div key={meetup.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{meetup.requesterName ?? `User #${meetup.requesterUserId}`}</p>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            {meetup.petName ?? "Thú cưng"}
                          </span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${MEETUP_STYLES[meetup.status] ?? "bg-slate-100 text-slate-500"}`}>
                            {MEETUP_LABELS[meetup.status] ?? meetup.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(meetup.createdAt)}</p>
                        {meetup.message ? <p className="mt-2 text-sm text-slate-600">{meetup.message}</p> : null}
                      </div>
                    </div>
                    {meetup.status === "PENDING" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void respondMeetup(meetup.id, true)}
                          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                        >
                          Chấp nhận
                        </button>
                        <button
                          type="button"
                          onClick={() => void respondMeetup(meetup.id, false)}
                          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          ) : null}

          <p className="px-1 pt-2 text-sm font-semibold text-slate-700">Lời mời bạn đã gửi</p>
          {sentMeetups.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
              <p className="font-medium text-slate-500">Bạn chưa gửi lời mời nào.</p>
              <p className="mt-1 text-sm text-slate-400">Vào tab Bản đồ để mời tham gia phiên đi dạo quanh bạn.</p>
            </div>
          ) : (
            sentMeetups.map((meetup) => (
              <div key={`sent-${meetup.id}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">Phiên #{meetup.walkSessionId}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${MEETUP_STYLES[meetup.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {MEETUP_LABELS[meetup.status] ?? meetup.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(meetup.createdAt)}</p>
                    {meetup.message ? <p className="mt-2 text-sm text-slate-600">{meetup.message}</p> : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {walkShareDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{walkShareDraft.title}</p>
                <p className="text-xs text-slate-500">Bạn có thể sửa text và chọn quyền xem trước khi đăng.</p>
              </div>
              <button
                type="button"
                onClick={() => setWalkShareDraft(null)}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <textarea
              value={walkShareDraft.content}
              onChange={(e) =>
                setWalkShareDraft((prev) => (prev ? { ...prev, content: e.target.value } : prev))
              }
              rows={8}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
            <div className="mt-2">
              <label className="text-xs text-slate-600">
                Quyền xem
                <select
                  value={walkShareDraft.visibility}
                  onChange={(e) =>
                    setWalkShareDraft((prev) =>
                      prev ? { ...prev, visibility: e.target.value as "PUBLIC" | "FRIENDS" | "PRIVATE" } : prev
                    )
                  }
                  className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                >
                  <option value="PUBLIC">Công khai</option>
                  <option value="FRIENDS">Bạn bè</option>
                  <option value="PRIVATE">Riêng tư</option>
                </select>
              </label>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWalkShareDraft(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void confirmWalkShareDraft()}
                disabled={sharingSessionId === walkShareDraft.sessionId}
                className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {sharingSessionId === walkShareDraft.sessionId ? "Đang đăng..." : "Đăng lên bảng tin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
