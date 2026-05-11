"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getAuthTokens } from "@/lib/api/authToken";
import { getUserById } from "@/lib/api/userApi";
import { chatApi } from "@/lib/api/chatApi";
import { encodeMessageContent } from "@/lib/chat/messageAttachment";
import {
  addCallEventListener,
  CallEventType,
  CallRealtimeEvent,
  initCallSocket,
  sendCallSignal,
} from "@/lib/socket/callSocket";

// ─── Types ────────────────────────────────────────────────────────────────────
export type CallStatus =
  | "IDLE"
  | "CALLING"
  | "RINGING"
  | "INCOMING"
  | "CONNECTED";

export interface CallInfo {
  status: CallStatus;
  callId: string | null;
  mediaType: "voice" | "video";
  peerId: number | null;
  peerName: string;
  isCallee: boolean;
  conversationId: number | null;
}

interface CallContextValue {
  callInfo: CallInfo;
  startCall: (
    targetUserId: number,
    mediaType: "voice" | "video",
    peerName?: string,
    conversationId?: number
  ) => void;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseUserIdFromToken(token: string): number | null {
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    return Number(p.sub ?? p.userId ?? p.id) || null;
  } catch {
    return null;
  }
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

const IDLE: CallInfo = {
  status: "IDLE",
  callId: null,
  mediaType: "voice",
  peerId: null,
  peerName: "",
  isCallee: false,
  conversationId: null,
};

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// ─── Provider ─────────────────────────────────────────────────────────────────
export default function CallProvider({ children }: { children: React.ReactNode }) {
  const [callInfo, setCallInfoState] = useState<CallInfo>(IDLE);
  const [connectedSecs, setConnectedSecs] = useState(0);
  const [ringingSecs, setRingingSecs] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const callInfoRef = useRef<CallInfo>(IDLE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentUserIdRef = useRef<number>(-1);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingWebRtcEventsRef = useRef<CallRealtimeEvent[]>([]);
  const pcSetupDoneRef = useRef(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const interactionBoundRef = useRef(false);

  useEffect(() => {
    const token = getAuthTokens()?.accessToken ?? "";
    currentUserIdRef.current = parseUserIdFromToken(token) ?? -1;
  }, []);

  const setCall = useCallback((info: CallInfo) => {
    callInfoRef.current = info;
    setCallInfoState(info);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setConnectedSecs(0);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => setConnectedSecs((s) => s + 1), 1000);
  }, [stopTimer]);

  // ─── WebRTC cleanup ──────────────────────────────────────────────────────────
  const cleanupWebRTC = useCallback(() => {
    setLocalStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
    setRemoteStream(null);
    pendingIceCandidatesRef.current = [];
    pendingWebRtcEventsRef.current = [];
    pcSetupDoneRef.current = false;

    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onnegotiationneeded = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsMuted(false);
    setIsCameraOff(false);
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  }, []);

  const ensureAudioContext = useCallback(async (): Promise<AudioContext | null> => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
      return audioContextRef.current;
    } catch {
      return null;
    }
  }, []);

  const playTone = useCallback((ctx: AudioContext, frequency = 880, durationMs = 180) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.02);
  }, []);

  const startRingtone = useCallback(
    async (mode: "INCOMING" | "OUTGOING") => {
      stopRingtone();
      const ctx = await ensureAudioContext();
      if (!ctx) return;
      const playPattern = () => {
        if (mode === "INCOMING") {
          playTone(ctx, 930, 180);
          setTimeout(() => playTone(ctx, 740, 180), 220);
        } else {
          playTone(ctx, 520, 150);
        }
      };
      playPattern();
      ringtoneIntervalRef.current = setInterval(playPattern, mode === "INCOMING" ? 1400 : 1000);
    },
    [ensureAudioContext, playTone, stopRingtone]
  );

  const resetToIdle = useCallback(() => {
    stopTimer();
    stopRingtone();
    cleanupWebRTC();
    setIsMinimized(false);
    setMediaError(null);
    setCall(IDLE);
  }, [stopTimer, stopRingtone, cleanupWebRTC, setCall]);

  const resolveConversationId = useCallback(async (info: CallInfo): Promise<number | null> => {
    if (info.conversationId) return info.conversationId;
    if (!info.peerId) return null;
    const me = currentUserIdRef.current;
    if (me <= 0) return null;
    try {
      const list = await chatApi.listConversations();
      const found = list.find(
        (c) =>
          c.type === "PRIVATE" &&
          c.memberIds.includes(me) &&
          c.memberIds.includes(info.peerId as number)
      );
      return found?.id ?? null;
    } catch {
      return null;
    }
  }, []);

  const appendCallLog = useCallback(
    async (info: CallInfo, content: string) => {
      const conversationId = await resolveConversationId(info);
      if (!conversationId) return;
      try {
        await chatApi.sendMessage(
          conversationId,
          encodeMessageContent(content, []),
          `call-log-${Date.now()}-${Math.random()}`
        );
      } catch {
        // no-op
      }
    },
    [resolveConversationId]
  );

  // ─── Process a queued/incoming WebRTC event against an active PC ─────────────
  const applyWebRtcEvent = useCallback(async (event: CallRealtimeEvent) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (event.eventType === "WEBRTC_OFFER") {
      const sdp = event.payload.sdp as RTCSessionDescriptionInit | undefined;
      if (!sdp) return;
      try {
        if (pc.signalingState !== "stable" && pc.signalingState !== "have-local-offer") {
          return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        for (const c of pendingIceCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingIceCandidatesRef.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendCallSignal({
          eventType: "WEBRTC_ANSWER",
          callId: callInfoRef.current.callId,
          payload: { sdp: pc.localDescription },
        });
      } catch (err) {
        console.error("[CallProvider] WEBRTC_OFFER handling error:", err);
      }
      return;
    }

    if (event.eventType === "WEBRTC_ANSWER") {
      const sdp = event.payload.sdp as RTCSessionDescriptionInit | undefined;
      if (!sdp) return;
      try {
        if (pc.signalingState !== "have-local-offer") {
          return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        for (const c of pendingIceCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingIceCandidatesRef.current = [];
      } catch (err) {
        console.error("[CallProvider] WEBRTC_ANSWER handling error:", err);
      }
      return;
    }

    if (event.eventType === "WEBRTC_ICE_CANDIDATE") {
      const candidate = event.payload.candidate as RTCIceCandidateInit | undefined;
      if (!candidate) return;
      if (!pc.remoteDescription) {
        pendingIceCandidatesRef.current.push(candidate);
      } else {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("[CallProvider] ICE candidate error:", err);
        }
      }
    }
  }, []);

  // ─── Setup peer connection ───────────────────────────────────────────────────
  const setupPeerConnection = useCallback(
    (callId: string, mediaType: "voice" | "video", isCallee: boolean, stream: MediaStream) => {
      if (peerConnectionRef.current) return;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        const [rs] = event.streams;
        if (rs) {
          setRemoteStream((prev) => (prev?.id === rs.id ? prev : rs));
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && callInfoRef.current.callId) {
          sendCallSignal({
            eventType: "WEBRTC_ICE_CANDIDATE",
            callId: callInfoRef.current.callId,
            payload: { candidate: event.candidate.toJSON() },
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
          console.warn("[CallProvider] ICE:", pc.iceConnectionState);
        }
      };

      // Caller creates offer
      if (!isCallee) {
        pc.onnegotiationneeded = async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendCallSignal({
              eventType: "WEBRTC_OFFER",
              callId,
              payload: { sdp: pc.localDescription },
            });
          } catch (err) {
            console.error("[CallProvider] createOffer error:", err);
          }
        };
      }

      pcSetupDoneRef.current = true;

      // Flush pending WebRTC events (e.g. WEBRTC_OFFER received before PC was ready)
      const pending = pendingWebRtcEventsRef.current.splice(0);
      for (const e of pending) {
        void applyWebRtcEvent(e);
      }
    },
    [applyWebRtcEvent]
  );

  // ─── Start WebRTC (get media + setup PC) ─────────────────────────────────────
  const startWebRTC = useCallback(
    async (callId: string, mediaType: "voice" | "video", isCallee: boolean) => {
      try {
        if (
          typeof window !== "undefined" &&
          !window.isSecureContext &&
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1"
        ) {
          setMediaError(
            "Trình duyệt chặn mic/cam trên HTTP (điện thoại truy cập bằng IP). Hãy test qua HTTPS tunnel hoặc mở bằng localhost trên thiết bị phù hợp."
          );
          return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          setMediaError("Thiết bị/trình duyệt không hỗ trợ getUserMedia.");
          return;
        }
        setMediaError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mediaType === "video",
        });
        setLocalStream(stream);
        setupPeerConnection(callId, mediaType, isCallee, stream);
      } catch (err) {
        console.error("[CallProvider] getUserMedia failed:", err);
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError") {
          setMediaError("Bạn đã chặn quyền mic/cam. Hãy mở quyền trong trình duyệt.");
        } else if (name === "NotFoundError") {
          setMediaError("Không tìm thấy mic hoặc camera phù hợp trên thiết bị.");
        } else if (name === "NotReadableError") {
          setMediaError("Mic/cam đang bị ứng dụng khác chiếm dụng.");
        } else {
          setMediaError("Không thể mở mic/cam. Kiểm tra quyền truy cập và thử lại.");
        }
      }
    },
    [setupPeerConnection]
  );

  // ─── Event handler ──────────────────────────────────────────────────────────
  const handleEvent = useCallback(
    (event: CallRealtimeEvent) => {
      const me = currentUserIdRef.current;
      const cur = callInfoRef.current;

      switch (event.eventType) {
        case "CALL_INVITE":
          if (event.fromUserId === me) {
            if (cur.status === "CALLING" || cur.status === "RINGING") {
              setCall({ ...cur, callId: event.callId });
            }
          } else if (event.toUserId === me && cur.status !== "CONNECTED") {
            const peerId = event.fromUserId;
            getUserById(String(peerId))
              .then((u) =>
                setCall({
                  status: "INCOMING",
                  callId: event.callId,
                  mediaType: event.mediaType ?? "voice",
                  peerId,
                  peerName: u.fullName || `Người dùng #${peerId}`,
                  isCallee: true,
                  conversationId: null,
                })
              )
              .catch(() =>
                setCall({
                  status: "INCOMING",
                  callId: event.callId,
                  mediaType: event.mediaType ?? "voice",
                  peerId,
                  peerName: `Người dùng #${peerId}`,
                  isCallee: true,
                  conversationId: null,
                })
              );
          }
          break;

        case "USER_RINGING":
          if (event.toUserId === me && cur.status === "CALLING") {
            setCall({ ...cur, status: "RINGING" });
          }
          break;

        case "CALL_CONNECTED":
          if (
            (event.fromUserId === me || event.toUserId === me) &&
            cur.status !== "IDLE" &&
            cur.status !== "CONNECTED"
          ) {
            const resolved = { ...cur, status: "CONNECTED" as const, callId: event.callId || cur.callId };
            setCall(resolved);
            startTimer();
            void startWebRTC(event.callId || cur.callId || "", cur.mediaType, cur.isCallee);
          }
          break;

        case "CALL_ACCEPT":
          if (event.toUserId === me && cur.callId == null && event.callId) {
            setCall({ ...cur, callId: event.callId });
          }
          break;

        case "CALL_REJECT":
          if (cur.status === "CALLING" || cur.status === "RINGING") {
            void appendCallLog(
              cur,
              `📞 Cuộc gọi nhỡ (${cur.mediaType === "video" ? "Video call" : "Voice call"}): ${cur.peerName} đã từ chối. Nhấn gọi lại để thử lại.`
            );
            resetToIdle();
          }
          break;

        case "CALL_CANCEL":
          if (cur.status === "INCOMING") resetToIdle();
          break;

        case "CALL_END":
          if (cur.status !== "IDLE") resetToIdle();
          break;

        case "CALL_BUSY":
          if (cur.status === "CALLING" || cur.status === "RINGING") {
            void appendCallLog(
              cur,
              `📞 ${cur.peerName} đang bận (${cur.mediaType === "video" ? "Video call" : "Voice call"}). Thử gọi lại sau.`
            );
            resetToIdle();
          }
          break;

        case "CALL_TIMEOUT":
          if (cur.status !== "IDLE") {
            void appendCallLog(
              cur,
              `📞 Cuộc gọi nhỡ (${cur.mediaType === "video" ? "Video call" : "Voice call"}) với ${cur.peerName}. Nhấn gọi lại.`
            );
            resetToIdle();
          }
          break;

        case "CALL_ERROR":
          if (cur.status !== "IDLE") resetToIdle();
          break;

        case "WEBRTC_OFFER":
        case "WEBRTC_ANSWER":
        case "WEBRTC_ICE_CANDIDATE":
          if (!pcSetupDoneRef.current) {
            pendingWebRtcEventsRef.current.push(event);
          } else {
            void applyWebRtcEvent(event);
          }
          break;
      }
    },
    [appendCallLog, resetToIdle, setCall, startTimer, startWebRTC, applyWebRtcEvent]
  );

  // ─── Init socket ────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getAuthTokens()?.accessToken ?? "";
    const uid = parseUserIdFromToken(token) ?? -1;
    if (uid < 0) return;
    currentUserIdRef.current = uid;
    initCallSocket(uid);
    const unsub = addCallEventListener(handleEvent);
    return () => {
      unsub();
      stopTimer();
    };
  }, [handleEvent, stopTimer]);

  useEffect(() => {
    if (interactionBoundRef.current) return;
    const unlockAudio = () => {
      void ensureAudioContext();
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      interactionBoundRef.current = true;
    };
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [ensureAudioContext]);

  useEffect(() => {
    if (callInfo.status === "INCOMING") {
      void startRingtone("INCOMING");
      return;
    }
    if (callInfo.status === "CALLING" || callInfo.status === "RINGING") {
      void startRingtone("OUTGOING");
      return;
    }
    stopRingtone();
  }, [callInfo.status, startRingtone, stopRingtone]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      void remoteVideoRef.current.play().catch(() => undefined);
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      void localVideoRef.current.play().catch(() => undefined);
    }
  }, [localStream]);

  useEffect(
    () => () => {
      stopRingtone();
      audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
    },
    [stopRingtone]
  );

  // ─── Actions ────────────────────────────────────────────────────────────────
  const startCall = useCallback(
    (
      targetUserId: number,
      mediaType: "voice" | "video",
      peerName?: string,
      conversationId?: number
    ) => {
      if (callInfoRef.current.status !== "IDLE") return;
      setCall({
        status: "CALLING",
        callId: null,
        mediaType,
        peerId: targetUserId,
        peerName: peerName || `Người dùng #${targetUserId}`,
        isCallee: false,
        conversationId: conversationId ?? null,
      });
      sendCallSignal({
        eventType: "CALL_INVITE",
        targetUserId,
        mediaType,
        deviceId: `web-${Date.now()}`,
        payload: {},
      });
    },
    [setCall]
  );

  const acceptCall = useCallback(() => {
    const cur = callInfoRef.current;
    if (!cur.isCallee) return;
    if (cur.status !== "INCOMING" && cur.status !== "RINGING" && cur.status !== "CALLING") return;
    if (!cur.callId) return;
    sendCallSignal({
      eventType: "CALL_ACCEPT",
      callId: cur.callId,
      deviceId: `web-${Date.now()}`,
      payload: {},
    });
    setCall({ ...cur, status: "CONNECTED" });
    startTimer();
    void startWebRTC(cur.callId, cur.mediaType, true);
  }, [setCall, startTimer, startWebRTC]);

  const rejectCall = useCallback(() => {
    const cur = callInfoRef.current;
    if (cur.status !== "INCOMING" || !cur.callId) return;
    sendCallSignal({ eventType: "CALL_REJECT", callId: cur.callId, payload: {} });
    resetToIdle();
  }, [resetToIdle]);

  const endCall = useCallback(() => {
    const cur = callInfoRef.current;
    if (cur.status === "IDLE") return;
    if (cur.status === "CONNECTED") {
      void appendCallLog(
        cur,
        `📞 Cuộc gọi kết thúc • Thời lượng ${formatDuration(connectedSecs)} • ${cur.mediaType === "video" ? "Video call" : "Voice call"}`
      );
    } else if (cur.status === "CALLING" || cur.status === "RINGING") {
      void appendCallLog(
        cur,
        `📞 Cuộc gọi nhỡ (${cur.mediaType === "video" ? "Video call" : "Voice call"}) với ${cur.peerName}. Nhấn gọi lại.`
      );
    }
    if (cur.callId) {
      const evt: CallEventType =
        cur.status === "INCOMING"
          ? "CALL_REJECT"
          : cur.status === "CALLING" || cur.status === "RINGING"
            ? "CALL_CANCEL"
            : "CALL_END";
      sendCallSignal({ eventType: evt, callId: cur.callId, payload: {} });
    }
    resetToIdle();
  }, [appendCallLog, connectedSecs, resetToIdle]);

  const toggleMute = useCallback(() => {
    const stream = localStream;
    if (!stream) return;
    const audio = stream.getAudioTracks()[0];
    if (!audio) return;
    audio.enabled = !audio.enabled;
    setIsMuted(!audio.enabled);
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    const stream = localStream;
    if (!stream) return;
    const video = stream.getVideoTracks()[0];
    if (!video) return;
    video.enabled = !video.enabled;
    setIsCameraOff(!video.enabled);
  }, [localStream]);

  // ─── Render helpers ──────────────────────────────────────────────────────────
  const avatarLetter = callInfo.peerName.charAt(0).toUpperCase() || "?";
  const callModeLabel = callInfo.mediaType === "video" ? "Video call" : "Voice call";

  useEffect(() => {
    const isRingingStage =
      callInfo.status === "CALLING" ||
      callInfo.status === "RINGING" ||
      callInfo.status === "INCOMING";
    if (!isRingingStage) {
      setRingingSecs(0);
      return;
    }
    const id = setInterval(() => setRingingSecs((prev) => prev + 1), 1000);
    return () => clearInterval(id);
  }, [callInfo.status]);

  const dialingScreen =
    (callInfo.status === "CALLING" ||
      callInfo.status === "RINGING" ||
      callInfo.status === "INCOMING") && (
      <div className={`fixed inset-0 z-[9999] flex flex-col overflow-hidden ${isMinimized ? "hidden" : ""}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950" />
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          <div className="absolute top-5 left-5">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="cursor-pointer px-3 py-1.5 text-xs rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/20 transition"
            >
              Thu nhỏ
            </button>
          </div>
          <div className="text-center mb-8">
            <p className="text-white/70 text-xs uppercase tracking-[0.24em] font-semibold">
              {callModeLabel}
            </p>
            <p className="text-white text-3xl sm:text-4xl font-bold mt-2">{callInfo.peerName}</p>
            <p className="text-white/70 text-sm mt-2 font-mono">
              {callInfo.status === "INCOMING"
                ? "Cuộc gọi đến..."
                : callInfo.status === "CALLING"
                  ? "Đang gọi..."
                  : "Đang đổ chuông..."}{" "}
              · {formatDuration(ringingSecs)}
            </p>
          </div>
          {mediaError ? (
            <p className="mb-5 max-w-md rounded-xl border border-amber-300/40 bg-amber-500/20 px-4 py-2 text-center text-xs text-amber-100">
              {mediaError}
            </p>
          ) : null}

          <div className="relative mb-10">
            <span className="absolute -inset-12 rounded-full border border-white/20 animate-ping [animation-duration:2s]" />
            <span className="absolute -inset-6 rounded-full border border-white/25 animate-ping [animation-duration:2.4s] [animation-delay:400ms]" />
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-5xl font-bold shadow-2xl border-4 border-white/20">
              {avatarLetter}
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={endCall}
              title={callInfo.status === "INCOMING" ? "Từ chối" : "Hủy cuộc gọi"}
              className="cursor-pointer w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-90 flex items-center justify-center text-white shadow-2xl transition relative z-10"
            >
              <HangUpIcon />
            </button>
            {callInfo.isCallee && (
              <button
                type="button"
                onClick={acceptCall}
                title="Bắt máy"
                className="cursor-pointer w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-90 flex items-center justify-center text-white shadow-2xl transition relative z-10"
              >
                <AnswerIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    );

  // ─── Connected call screen ───────────────────────────────────────────────────
  const connectedScreen = callInfo.status === "CONNECTED" && (
    <div className={`fixed inset-0 z-[9999] flex flex-col select-none ${isMinimized ? "hidden" : ""}`}>
      {/* ── Video call ─────────────────────────────────────────────────────────── */}
      {callInfo.mediaType === "video" ? (
        <div className="relative flex-1 bg-black overflow-hidden">
          {mediaError ? (
            <div className="absolute left-4 right-4 top-16 z-20 rounded-xl border border-amber-300/40 bg-amber-500/20 px-4 py-2 text-center text-xs text-amber-100">
              {mediaError}
            </div>
          ) : null}
          {/* Remote video */}
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 gap-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-4xl font-bold shadow-2xl">
                {avatarLetter}
              </div>
              <p className="text-white text-lg font-semibold">{callInfo.peerName}</p>
              <p className="text-white/50 text-sm">Đang kết nối video...</p>
            </div>
          )}

          {/* Top gradient overlay */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />

          {/* Peer name & timer */}
          <div className="absolute top-0 left-0 right-0 px-5 pt-5 flex items-start justify-between">
            <div>
              <p className="text-white font-bold text-lg drop-shadow">{callInfo.peerName}</p>
              <p className="text-white/70 text-sm font-mono mt-0.5">{formatDuration(connectedSecs)}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="cursor-pointer px-3 py-1.5 text-xs rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/20 transition"
            >
              Thu nhỏ
            </button>
          </div>

          {/* Local video PiP */}
          <div className="absolute top-20 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] ${isCameraOff ? "opacity-0" : ""}`}
              />
            ) : null}
            {isCameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 00-2 2v4a2 2 0 002 2h8M3 8h8M3 8l-1-1M21 3L3 21" />
                </svg>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 px-6 pb-8 flex items-center justify-center gap-4 pointer-events-auto">
            <CallControlBtn active={isMuted} onClick={toggleMute} title={isMuted ? "Bật mic" : "Tắt mic"}>
              {isMuted ? <MicOffIcon /> : <MicOnIcon />}
            </CallControlBtn>
            <CallControlBtn active={isCameraOff} onClick={toggleCamera} title={isCameraOff ? "Bật camera" : "Tắt camera"}>
              {isCameraOff ? <CameraOffIcon /> : <CameraOnIcon />}
            </CallControlBtn>
            <button
              type="button"
              onClick={endCall}
              title="Kết thúc"
              className="cursor-pointer w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-90 flex items-center justify-center text-white shadow-2xl transition"
            >
              <HangUpIcon />
            </button>
          </div>
        </div>
      ) : (
        /* ── Voice call ───────────────────────────────────────────────────────── */
        <div className="relative flex-1 flex flex-col items-center justify-between bg-gradient-to-b from-slate-800 via-slate-900 to-black px-6 py-10">
          {mediaError ? (
            <div className="absolute left-4 right-4 top-16 z-20 rounded-xl border border-amber-300/40 bg-amber-500/20 px-4 py-2 text-center text-xs text-amber-100">
              {mediaError}
            </div>
          ) : null}
          <div className="absolute top-5 left-5">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="cursor-pointer px-3 py-1.5 text-xs rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/20 transition"
            >
              Thu nhỏ
            </button>
          </div>
          <div />

          <div className="flex flex-col items-center gap-6">
            {/* Animated avatar */}
            <div className="relative flex items-center justify-center">
              <span className="absolute w-44 h-44 rounded-full bg-rose-500/10 animate-ping [animation-duration:2s]" />
              <span className="absolute w-36 h-36 rounded-full bg-rose-500/15 animate-ping [animation-duration:2s] [animation-delay:400ms]" />
              <span className="absolute w-28 h-28 rounded-full bg-rose-500/20 animate-ping [animation-duration:2s] [animation-delay:800ms]" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-4xl font-bold shadow-2xl relative z-10">
                {avatarLetter}
              </div>
            </div>
            <div className="text-center">
              <p className="text-white text-2xl font-bold">{callInfo.peerName}</p>
              <p className="text-white/50 text-sm mt-1 font-mono tabular-nums">{formatDuration(connectedSecs)}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-5">
            <CallControlBtn active={isMuted} onClick={toggleMute} title={isMuted ? "Bật mic" : "Tắt mic"}>
              {isMuted ? <MicOffIcon /> : <MicOnIcon />}
            </CallControlBtn>
            <button
              type="button"
              onClick={endCall}
              title="Kết thúc"
              className="cursor-pointer w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-90 flex items-center justify-center text-white shadow-2xl transition"
            >
              <HangUpIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <CallContext.Provider value={{ callInfo, startCall }}>
      {children}
      {dialingScreen}
      {connectedScreen}
      {callInfo.status !== "IDLE" && isMinimized && (
        <div className="fixed right-4 bottom-4 z-[9999] w-72 rounded-2xl border border-slate-200 bg-white shadow-2xl p-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center font-bold">
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{callInfo.peerName}</p>
              <p className="text-xs text-slate-500 font-mono">
                {callInfo.status === "CONNECTED" ? formatDuration(connectedSecs) : formatDuration(ringingSecs)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="cursor-pointer text-xs px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              Quay lại
            </button>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <CallControlBtn active={isMuted} onClick={toggleMute} title={isMuted ? "Bật mic" : "Tắt mic"}>
              {isMuted ? <MicOffIcon /> : <MicOnIcon />}
            </CallControlBtn>
            {callInfo.mediaType === "video" && callInfo.status === "CONNECTED" ? (
              <CallControlBtn active={isCameraOff} onClick={toggleCamera} title={isCameraOff ? "Bật camera" : "Tắt camera"}>
                {isCameraOff ? <CameraOffIcon /> : <CameraOnIcon />}
              </CallControlBtn>
            ) : null}
            <button
              type="button"
              onClick={endCall}
              className="cursor-pointer w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
              title="Kết thúc"
            >
              <HangUpIcon />
            </button>
          </div>
        </div>
      )}
    </CallContext.Provider>
  );
}

// ─── Small UI sub-components (defined outside to avoid re-mount on parent re-render) ──
function CallControlBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`cursor-pointer w-14 h-14 rounded-full flex items-center justify-center transition active:scale-90 ${
        active ? "bg-white text-slate-900 shadow-xl" : "bg-white/20 hover:bg-white/30 text-white"
      }`}
    >
      {children}
    </button>
  );
}

function MicOnIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
  );
}

function CameraOnIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M4 8h8a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2z" />
    </svg>
  );
}

function CameraOffIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 00-2 2v4a2 2 0 002 2h8M3 8h8M3 8l-1-1M21 3L3 21" />
    </svg>
  );
}

function HangUpIcon() {
  return (
    <svg className="w-7 h-7 rotate-[135deg]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
    </svg>
  );
}

function AnswerIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
    </svg>
  );
}
