"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { petApi } from "@/lib/api/petApi";
import type { PetSpecies } from "@/types/pet";
import type { PetDiagnosisDto } from "@/types/petDiagnosis";

type Props = {
  petId: number;
  petName: string;
  species: PetSpecies;
  isOwner: boolean;
};

type AssistantRole = "assistant" | "user";

type AssistantMessage = {
  id: string;
  role: AssistantRole;
  text: string;
  timestamp: string;
};

type DiagnosisStep =
  | "idle"
  | "primary_complaint"
  | "symptom_flags"
  | "triage"
  | "duration"
  | "temperature"
  | "ready";

type DiagnosisContext = {
  step: DiagnosisStep;
  primaryComplaint: string;
  appetiteLoss: boolean;
  energyDrop: boolean;
  vomiting: boolean;
  diarrhea: boolean;
  cough: boolean;
  breathingDifficulty: boolean;
  skinRash: boolean;
  fever: boolean;
  durationHours?: number;
  temperatureC?: number;
};

type CreateReplyResult = {
  text: string;
  suggestions: string[];
  newCtx: DiagnosisContext;
  isDone: boolean;
};

const SPECIES_LABELS: Record<PetSpecies, string> = {
  DOG: "chó", CAT: "mèo", BIRD: "chim", RABBIT: "thỏ",
  HAMSTER: "hamster", FISH: "cá", REPTILE: "bò sát", OTHER: "thú cưng",
};

const QUICK_PROMPTS = [
  "Bắt đầu chẩn đoán",
  "Hỏi về dinh dưỡng",
  "Huấn luyện cơ bản",
  "Vệ sinh & grooming",
];

const EMERGENCY_WORDS = ["khó thở", "co giật", "co quắp", "tê liệt", "bất tỉnh", "ngất", "máu"];

const STEP_LABELS: Record<DiagnosisStep, string> = {
  idle: "Tự do",
  primary_complaint: "Phàn nàn chính",
  symptom_flags: "Triệu chứng cụ thể",
  triage: "Phân loại khẩn cấp",
  duration: "Thời gian",
  temperature: "Nhiệt độ",
  ready: "Sẵn sàng chẩn đoán",
};

function formatDate(input: string) {
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return input;
  return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function normalizeText(input: string) { return input.toLowerCase().trim(); }

function hasEmergency(text: string) {
  return EMERGENCY_WORDS.some((w) => normalizeText(text).includes(w));
}

function buildSymptomText(ctx: DiagnosisContext): string {
  const parts: string[] = [ctx.primaryComplaint];
  if (ctx.appetiteLoss) parts.push("bỏ ăn");
  if (ctx.energyDrop) parts.push("lờ đờ / giảm năng lượng");
  if (ctx.vomiting) parts.push("nôn / ói");
  if (ctx.diarrhea) parts.push("tiêu chảy");
  if (ctx.cough) parts.push("ho");
  if (ctx.breathingDifficulty) parts.push("khó thở");
  if (ctx.skinRash) parts.push("phát ban / ngứa da");
  if (ctx.fever) parts.push("sốt");
  if (ctx.durationHours !== undefined) parts.push(`kéo dài ${ctx.durationHours} giờ`);
  return parts.join("; ");
}

function extractSymptomsFromText(text: string, ctx: DiagnosisContext): Partial<DiagnosisContext> {
  const lower = normalizeText(text);
  const extracted: Partial<DiagnosisContext> = {};

  const hourMatch = lower.match(/(\d+)\s*(?:giờ|gio|hour|hours|h)/);
  const dayMatch = lower.match(/(\d+)\s*(?:ngày|ngay|day|days|d)/);
  if (hourMatch) extracted.durationHours = parseInt(hourMatch[1], 10);
  else if (dayMatch) extracted.durationHours = parseInt(dayMatch[1], 10) * 24;

  const tempMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:độ|°c|°c|c)/);
  if (tempMatch) extracted.temperatureC = parseFloat(tempMatch[1].replace(",", "."));

  if (/bỏ ăn|không ăn|kém ăn|lười ăn/.test(lower)) extracted.appetiteLoss = true;
  if (/lờ đờ|mệt|uể oải|giảm năng lượng|yếu/.test(lower)) extracted.energyDrop = true;
  if (/nôn|óic|ói|mửa/.test(lower)) extracted.vomiting = true;
  if (/tiêu chảy|ỉa|phân lỏng|đi ngoài/.test(lower)) extracted.diarrhea = true;
  if (/ho|hắt hơi/.test(lower)) extracted.cough = true;
  if (/khó thở|thở nhanh|thở gấp|thở khò khè/.test(lower)) extracted.breathingDifficulty = true;
  if (/phát ban|ngứa|da|rỉ mủ|viêm da/.test(lower)) extracted.skinRash = true;
  if (/sốt|nóng|tăng thân nhiệt/.test(lower)) extracted.fever = true;

  const keys = ["appetiteLoss", "energyDrop", "vomiting", "diarrhea", "cough", "breathingDifficulty", "skinRash", "fever"] as const;
  keys.forEach((k) => {
    if (extracted[k] !== undefined) extracted[k] = extracted[k] || (ctx as DiagnosisContext)[k];
  });

  return extracted;
}

function mergeCtx(prev: DiagnosisContext, update: Partial<DiagnosisContext>): DiagnosisContext {
  return { ...prev, ...update };
}

function createReply(
  text: string,
  ctx: DiagnosisContext,
  petName: string,
  latestDiagnosis: PetDiagnosisDto | null,
  species: PetSpecies
): CreateReplyResult {
  const speciesLabel = SPECIES_LABELS[species];
  const lower = normalizeText(text);

  if (hasEmergency(text)) {
    return {
      text: `⚠️ Mình nhận thấy ${petName} có dấu hiệu CẤP CỨU (${text}). Hãy đưa bé đến phòng khám thú y gần nhất NGAY hoặc gọi cấp cứu. TUYỆT ĐỐI KHÔNG chờ phản hồi chat khi bé có triệu chứng này.`,
      suggestions: ["Quay lại hỏi khác", "Hủy chẩn đoán"],
      newCtx: { ...ctx, step: "idle" },
      isDone: false,
    };
  }

  if (ctx.step === "idle") {
    const startDiagnosis = lower.includes("bắt đầu chẩn đoán") || lower.includes("chẩn đoán");

    if (startDiagnosis) {
      return {
        text: `Bắt đầu quy trình chẩn đoán cho ${petName} (${speciesLabel}). Mô tả ngắn gọn triệu chứng hoặc phàn nàn chính của bé:`,
        suggestions: ["Bỏ ăn từ hôm qua", "Lờ đờ, không vui", "Nôn liên tục", "Ho suốt mấy ngày"],
        newCtx: { ...ctx, step: "primary_complaint" },
        isDone: false,
      };
    }

    if (/tiêm|vaccine|tẩy giun/.test(lower)) {
      return {
        text: `Về chăm sóc định kỳ cho ${speciesLabel}, bạn nên theo dõi lịch tiêm phòng, tẩy giun, kiểm tra răng miệng và cân nặng. Nếu muốn, mình có thể giúp bạn đặt nhắc nhở thú y trong sổ sức khỏe.`,
        suggestions: QUICK_PROMPTS,
        newCtx: ctx,
        isDone: false,
      };
    }

    if (/thú y|phòng khám|liên hệ|đặt lịch thú y/.test(lower)) {
      return {
        text: `Bạn có thể qua tab "Sức khỏe" để tạo lịch khám và chọn thú y gần đây. Nếu bé đang có triệu chứng cấp cứu, hãy đi thú y ngay.`,
        suggestions: QUICK_PROMPTS,
        newCtx: ctx,
        isDone: false,
      };
    }

    if (/chăm sóc|dinh dưỡng|cho ăn/.test(lower)) {
      return {
        text: `Với ${speciesLabel}, mình gợi ý bạn chú ý: chế độ ăn phù hợp theo độ tuổi và cân nặng, nước sạch luôn có sẵn, và vận động vừa phải. Bạn muốn tìm hiểu thêm về khía cạnh nào?`,
        suggestions: QUICK_PROMPTS,
        newCtx: ctx,
        isDone: false,
      };
    }

    if (latestDiagnosis && (lower.includes("bệnh") || lower.includes("chẩn đoán") || lower.includes("triệu chứng"))) {
      return {
        text: `Chẩn đoán gần nhất của ${petName} là **${latestDiagnosis.likelyDisease}** với mức độ ${latestDiagnosis.severity.toLowerCase()}. ${latestDiagnosis.summary}. Nếu bạn muốn, có thể mô tả thêm triệu chứng, nhiệt độ, thời gian kéo dài để mình gợi ý bước tiếp theo.`,
        suggestions: QUICK_PROMPTS,
        newCtx: ctx,
        isDone: false,
      };
    }

    if (/giống|breed|chó|mèo/.test(lower)) {
      return {
        text: `Mỗi giống ${speciesLabel} có đặc điểm riêng về tính cách, nhu cầu vận động và sức khỏe. Bạn muốn biết thêm về giống cụ thể nào, hay mình tư vấn chung về giống của ${petName}?`,
        suggestions: ["Tư vấn giống cụ thể", "So sánh giống phổ biến", "Giống nào dễ nuôi nhất?"],
        newCtx: ctx,
        isDone: false,
      };
    }

    if (/huấn luyện|dạy|training|lệnh/.test(lower)) {
      return {
        text: `Với ${speciesLabel}, huấn luyện cơ bản bao gồm: ngồi, nằm, đứng, không kéo dây, và đi vệ sinh đúng chỗ. Bạn đang gặp vấn đề hành vi nào với ${petName}?`,
        suggestions: ["Dạy ngồi / nằm", "Hành vi phá phách", "Xả stress cho pet"],
        newCtx: ctx,
        isDone: false,
      };
    }

    if (/tắm|gội|vệ sinh|lông|móng/.test(lower)) {
      return {
        text: `Về vệ sinh cho ${speciesLabel}: tắm 1-2 lần/tuần (chó) hoặc 1-2 lần/tháng (mèo), cắt móng 2-4 tuần/lần, vệ sinh tai, và chải lông thường xuyên. Bạn muốn hỏi về sản phẩm hay tần suất cụ thể?`,
        suggestions: ["Cách tắm đúng", "Chải lông đúng cách", "Cắt móng tại nhà", "Vệ sinh tai"],
        newCtx: ctx,
        isDone: false,
      };
    }

    if (/dinh dưỡng|thức ăn/.test(lower)) {
      return {
        text: `Dinh dưỡng cho ${speciesLabel} phụ thuộc vào độ tuổi, cân nặng và mức độ vận động. Nên chọn thức ăn chất lượng, có thành phần protein cao, hạn chế carbohydrate xử lý.`,
        suggestions: ["Loại thức ăn tốt", "Thức ăn cần tránh", "Tần suất cho ăn", "Bổ sung dinh dưỡng"],
        newCtx: ctx,
        isDone: false,
      };
    }

    if (/đi dạo|vận động|chạy|tập thể dục/.test(lower)) {
      return {
        text: `Về vận động cho ${speciesLabel}, nhu cầu khác nhau theo giống và độ tuổi. Vào tab "Đi dạo" để bật GPS, xem session xung quanh bạn và mời gặp những người đi dạo cùng.`,
        suggestions: ["Mở tab Đi dạo", "Bật GPS", "Xem session gần đây", "Hỏi về vận động"],
        newCtx: ctx,
        isDone: false,
      };
    }

    return {
      text: `Mình là trợ lý của ${petName} (${speciesLabel}). Bạn có thể bắt đầu chẩn đoán, hỏi về vaccine, đặt lịch thú y, hoặc hỏi về cách chăm sóc.`,
      suggestions: QUICK_PROMPTS,
      newCtx: ctx,
      isDone: false,
    };
  }

  if (ctx.step === "primary_complaint") {
    const complaint = text.trim();
    const extracted = extractSymptomsFromText(text, ctx);
    const updated = mergeCtx({ ...ctx, primaryComplaint: complaint }, extracted);
    const flags = [
      extracted.appetiteLoss || ctx.appetiteLoss ? "bỏ ăn" : null,
      extracted.energyDrop || ctx.energyDrop ? "lờ đờ" : null,
      extracted.vomiting || ctx.vomiting ? "nôn" : null,
      extracted.diarrhea || ctx.diarrhea ? "tiêu chảy" : null,
      extracted.cough || ctx.cough ? "ho" : null,
      extracted.breathingDifficulty || ctx.breathingDifficulty ? "khó thở" : null,
      extracted.skinRash || ctx.skinRash ? "phát ban da" : null,
      extracted.fever || ctx.fever ? "sốt" : null,
    ].filter(Boolean) as string[];
    const flagged = flags.join(", ");

    return {
      text: `Đã ghi nhận: "${complaint}"${flagged ? ` (có dấu hiệu: ${flagged})` : ""}. Bây giờ mình sẽ hỏi về từng triệu chứng cụ thể. **Bé có bỏ ăn hoặc ăn ít hơn bình thường không?**`,
      suggestions: ["Có, bỏ ăn", "Không, ăn bình thường", "Hơi kém ăn"],
      newCtx: { ...updated, step: "symptom_flags", appetiteLoss: extracted.appetiteLoss ?? ctx.appetiteLoss },
      isDone: false,
    };
  }

  if (ctx.step === "symptom_flags") {
    const extracted = extractSymptomsFromText(text, ctx);
    const merged = mergeCtx(ctx, extracted);
    const denies = /không\s|không\s*bỏ\s*ăn|bình\s*thường|vẫn\s*ăn|vẫn\s*hoạt\s*động/.test(lower);

    const symptoms = ["appetiteLoss", "energyDrop", "vomiting", "diarrhea", "cough", "breathingDifficulty", "skinRash", "fever"] as const;
    const confirmedFlags = symptoms.reduce((acc, key) => {
      if (denies) acc[key] = false;
      else acc[key] = (ctx as DiagnosisContext)[key] || extracted[key];
      return acc;
    }, {} as Partial<DiagnosisContext>);

    const nextStep: DiagnosisStep = "duration";
    const durationMsg = merged.durationHours !== undefined ? `Đã ghi nhận thời gian: ${merged.durationHours} giờ.` : "";

    return {
      text: `Đã thu thập triệu chứng cho ${petName}. ${durationMsg} **Bé có triệu chứng này kéo dài bao lâu rồi?** (ví dụ: 2 giờ, 1 ngày, 3 ngày)`,
      suggestions: ["Vài giờ (dưới 6h)", "1 ngày", "2-3 ngày", "Hơn 3 ngày"],
      newCtx: { ...ctx, ...confirmedFlags, step: nextStep },
      isDone: false,
    };
  }

  if (ctx.step === "duration") {
    const extracted = extractSymptomsFromText(text, ctx);
    const merged = mergeCtx(ctx, extracted);
    return {
      text: `Đã ghi nhận thời gian ${merged.durationHours !== undefined ? `${merged.durationHours} giờ` : "được mô tả"}. **Bạn có thể đo nhiệt độ cho ${petName} không? Nếu có, nhiệt độ bao nhiêu độ C?**`,
      suggestions: ["Chưa đo được", "38.5 độ", "39 độ", "40 độ", "Bình thường (~38.5)"],
      newCtx: { ...merged, step: "temperature" },
      isDone: false,
    };
  }

  if (ctx.step === "temperature") {
    const extracted = extractSymptomsFromText(text, ctx);
    const merged = mergeCtx(ctx, extracted);
    const temp = merged.temperatureC;

    if (temp !== undefined && temp > 41) {
      return {
        text: `⚠️ Nhiệt độ ${temp}°C của ${petName} rất CAO — đây là cấp cứu. Hãy đưa bé đến thú y NGAY và báo cho bác sĩ biết nhiệt độ.`,
        suggestions: ["Kết thúc chẩn đoán", "Quay lại hỏi khác"],
        newCtx: { ...merged, step: "idle" },
        isDone: false,
      };
    }

    const symptomsText = buildSymptomText(merged);
    return {
      text: `Đã thu thập đầy đủ thông tin cho ${petName}:\n• Triệu chứng: ${symptomsText}\n• Nhiệt độ: ${temp !== undefined ? `${temp}°C` : "chưa đo được"}\n\nĐang gửi dữ liệu để AI phân tích...`,
      suggestions: [],
      newCtx: { ...merged, step: "ready" },
      isDone: true,
    };
  }

  return {
    text: "Đã hoàn tất chẩn đoán. Cảm ơn bạn!",
    suggestions: QUICK_PROMPTS,
    newCtx: { ...ctx, step: "idle" },
    isDone: false,
  };
}

export default function PetAssistantSection({ petId, petName, species, isOwner }: Props) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(QUICK_PROMPTS);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(false);
  const [draft, setDraft] = useState("");
  const [latestDiagnosis, setLatestDiagnosis] = useState<PetDiagnosisDto | null>(null);
  const [diagnosisCtx, setDiagnosisCtx] = useState<DiagnosisContext>({
    step: "idle", primaryComplaint: "", appetiteLoss: false, energyDrop: false,
    vomiting: false, diarrhea: false, cough: false, breathingDifficulty: false, skinRash: false, fever: false,
  });
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speciesLabel = SPECIES_LABELS[species];

  const intro = useMemo(
    () => `Chào ${petName}. Mình là trợ lý ảo cho hệ sinh thái pet. Bạn có thể bắt đầu chẩn đoán, hỏi về ${speciesLabel}, vaccine hoặc hỏi cách chăm sóc.`,
    [petName, speciesLabel]
  );

  useEffect(() => {
    setMessages([{ id: "welcome", role: "assistant", text: intro, timestamp: new Date().toISOString() }]);
  }, [intro]);

  useEffect(() => {
    if (!isOwner) return;
    petApi.listDiagnoses(petId).then((items) => setLatestDiagnosis(items[0] ?? null)).catch(() => setLatestDiagnosis(null));
  }, [isOwner, petId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const inputPlaceholder = useMemo(() => {
    switch (diagnosisCtx.step) {
      case "primary_complaint": return "Mô tả triệu chứng chính của bé...";
      case "symptom_flags": return "Trả lời về triệu chứng bé đang có...";
      case "duration": return "Ví dụ: 2 giờ, 1 ngày...";
      case "temperature": return "Ví dụ: 38.5 độ (hoặc bỏ trống nếu chưa đo)";
      default: return "Nhập câu hỏi về bé...";
    }
  }, [diagnosisCtx.step]);

  const sendMessage = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean) return;

    const userMessage: AssistantMessage = { id: `u-${Date.now()}`, role: "user", text: clean, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);

    const { text: replyText, suggestions: replySuggestions, newCtx, isDone } = createReply(clean, diagnosisCtx, petName, latestDiagnosis, species);
    setDiagnosisCtx(newCtx);

    if (isDone) {
      setDiagnosisLoading(true);
      try {
        const symptomsText = buildSymptomText(newCtx);
        await petApi.submitSymptoms(petId, {
          symptomsText,
          temperatureC: newCtx.temperatureC,
          durationHours: newCtx.durationHours,
          appetiteLoss: newCtx.appetiteLoss,
          energyDrop: newCtx.energyDrop,
          vomiting: newCtx.vomiting,
          diarrhea: newCtx.diarrhea,
          cough: newCtx.cough,
          breathingDifficulty: newCtx.breathingDifficulty,
          skinRash: newCtx.skinRash,
        });
        const items = await petApi.listDiagnoses(petId);
        setLatestDiagnosis(items[0] ?? null);
        const diagnosisSuccess = items[0]
          ? `Chẩn đoán xong cho ${petName}: **${items[0].likelyDisease}** (${items[0].severity.toLowerCase()}). ${items[0].recommendation}`
          : replyText;
        const assistantMessage: AssistantMessage = { id: `a-${Date.now()}`, role: "assistant", text: diagnosisSuccess, timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, assistantMessage]);
        setSuggestions(QUICK_PROMPTS);
        setDiagnosisCtx({ step: "idle", primaryComplaint: "", appetiteLoss: false, energyDrop: false, vomiting: false, diarrhea: false, cough: false, breathingDifficulty: false, skinRash: false, fever: false });
      } catch {
        const errMsg: AssistantMessage = { id: `a-${Date.now()}`, role: "assistant", text: "Xin lỗi, mình không thể hoàn tất chẩn đoán lúc này. Bạn vui lòng thử lại hoặc liên hệ trực tiếp với thú y.", timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, errMsg]);
        setSuggestions(QUICK_PROMPTS);
      } finally {
        setDiagnosisLoading(false);
      }
      setDraft("");
      return;
    }

    const assistantMessage: AssistantMessage = { id: `a-${Date.now()}`, role: "assistant", text: replyText, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, assistantMessage]);
    setSuggestions(replySuggestions);
    setDraft("");
  }, [diagnosisCtx, latestDiagnosis, petId, petName, species]);

  return (
    <div className="space-y-5">

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600">✕</button>
        </div>
      ) : null}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-500">Assistant</p>
          <h2 className="mt-0.5 text-2xl font-semibold text-slate-900">Trợ lý cho {petName}</h2>
        </div>
        {/* Latest diagnosis preview */}
        {latestDiagnosis && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2">
            <div className={`h-2 w-2 rounded-full ${
              latestDiagnosis.severity === "EMERGENCY" ? "bg-rose-600 animate-pulse" :
              latestDiagnosis.severity === "HIGH" ? "bg-rose-500" :
              latestDiagnosis.severity === "MODERATE" ? "bg-amber-500" : "bg-emerald-500"
            }`} />
            <div>
              <p className="text-xs font-semibold text-slate-900">{latestDiagnosis.likelyDisease}</p>
              <p className="text-[11px] text-slate-500">{latestDiagnosis.severity} · Tin cậy {latestDiagnosis.confidenceScore}%</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
          {/* Chat card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
            {/* Chat header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Virtual conversation</p>
                <h3 className="mt-0.5 text-base font-semibold text-white">Hỏi gì cũng được</h3>
              </div>
              <div className="flex flex-col items-end gap-1">
                {diagnosisCtx.step !== "idle" && (
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-300">
                    {STEP_LABELS[diagnosisCtx.step]}
                  </span>
                )}
              </div>
            </div>

            {/* Diagnosis progress */}
            {diagnosisCtx.step !== "idle" && (
              <div className="px-5 pt-3">
                <div className="flex gap-1">
                  {(["primary_complaint", "symptom_flags", "duration", "temperature"] as DiagnosisStep[]).map((step, idx) => {
                    const steps = ["primary_complaint", "symptom_flags", "duration", "temperature"] as DiagnosisStep[];
                    const currentIdx = steps.indexOf(diagnosisCtx.step);
                    return (
                      <div key={step} className={`h-1 flex-1 rounded-full transition-colors ${
                        idx < currentIdx ? "bg-emerald-400" : idx === currentIdx ? "bg-amber-400" : "bg-white/10"
                      }`} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="max-h-[420px] space-y-3 overflow-y-auto px-5 py-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    message.role === "user"
                      ? "bg-rose-500 text-white"
                      : "border border-white/10 bg-white/8 text-white/90"
                  }`}>
                    <p style={{ whiteSpace: "pre-wrap" }}>{message.text}</p>
                    <p className="mt-1.5 text-[11px] uppercase tracking-[0.15em] text-white/40">{formatDate(message.timestamp)}</p>
                  </div>
                </div>
              ))}

              {diagnosisLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-3xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/60">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Đang phân tích triệu chứng...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            <div className="px-5 pb-3">
              <button
                type="button"
                onClick={() => setShowQuickSuggestions((v) => !v)}
                className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/15"
              >
                {showQuickSuggestions ? "Ẩn gợi ý nhanh" : "Hiện gợi ý nhanh"}
              </button>
            </div>
            {showQuickSuggestions && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 px-5 pb-3">
                {suggestions.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => sendMessage(prompt)} disabled={diagnosisLoading}
                    className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/15 disabled:opacity-40">
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={(e) => { e.preventDefault(); if (!diagnosisLoading) sendMessage(draft); }}
              className="flex gap-2 border-t border-white/10 px-5 py-4">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} disabled={diagnosisLoading}
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-50"
                placeholder={inputPlaceholder} />
              <button type="submit" disabled={diagnosisLoading || !draft.trim()}
                className="shrink-0 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:opacity-40">
                Gửi
              </button>
            </form>
          </div>

          {/* Tips */}
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div className="space-y-1.5 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Mẹo sử dụng</p>
              <p>Nếu bé có dấu hiệu cấp cứu (khó thở, co giật, sốt rất cao), đi thẳng thú y thay vì chờ chat.</p>
              <p>Bắt đầu chẩn đoán để AI thu thập triệu chứng và gợi ý bệnh tiềm năng cho {petName}.</p>
              <p>Hiện tại trợ lý chạy theo luồng hỏi đáp triage + dữ liệu chẩn đoán đã lưu, chưa fine-tune mô hình riêng.</p>
            </div>
          </div>
      </div>
    </div>
  );
}
