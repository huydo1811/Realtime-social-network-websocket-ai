"use client";

import { useMemo, useState } from "react";

type ReportTargetType = "POST" | "COMMENT" | "GROUP";

type Props = {
  open: boolean;
  targetType: ReportTargetType;
  submitting?: boolean;
  withActions?: boolean;
  onClose: () => void;
  onSubmit: (payload: { reason: string; hideForMe: boolean; blockUser: boolean }) => Promise<void> | void;
};

const PRESET_REASONS = [
  "Nội dung phản cảm",
  "Quấy rối / bắt nạt",
  "Ngôn từ thù ghét",
  "Spam / lừa đảo",
  "Thông tin sai lệch",
  "Khác",
];

export default function ReportContentModal({
  open,
  targetType,
  submitting = false,
  withActions = true,
  onClose,
  onSubmit,
}: Props) {
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [extraText, setExtraText] = useState("");
  const [hideForMe, setHideForMe] = useState(true);
  const [blockUser, setBlockUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => {
    if (targetType === "POST") return "Báo cáo bài viết";
    if (targetType === "COMMENT") return "Báo cáo bình luận";
    return "Báo cáo nhóm";
  }, [targetType]);

  const showActions = withActions && targetType !== "GROUP";

  if (!open) return null;

  async function handleSubmit() {
    const detail = extraText.trim();
    const reason = selectedReason === "Khác"
      ? detail
      : detail
        ? `${selectedReason}: ${detail}`
        : selectedReason;
    if (!reason) {
      setError("Vui lòng chọn lý do hoặc nhập mô tả.");
      return;
    }
    setError(null);
    await onSubmit({ reason, hideForMe, blockUser });
    setSelectedReason(PRESET_REASONS[0]);
    setExtraText("");
    setHideForMe(true);
    setBlockUser(false);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">
          Chon ly do phu hop, sau do co the ghi them chi tiet de quan tri vien xu ly nhanh hon.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PRESET_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelectedReason(reason)}
              className={`cursor-pointer rounded-xl border px-3 py-2 text-left text-sm transition ${
                selectedReason === reason
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        <textarea
          value={extraText}
          onChange={(e) => setExtraText(e.target.value)}
          placeholder={
            selectedReason === "Khác"
              ? "Mô tả lý do báo cáo..."
              : "Chi tiết bổ sung (không bắt buộc)..."
          }
          rows={4}
          className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-300"
        />

        {showActions ? (
          <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={hideForMe}
                onChange={(e) => setHideForMe(e.target.checked)}
                className="mt-0.5"
              />
              Ẩn nội dung này khỏi feed của tôi
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={blockUser}
                onChange={(e) => setBlockUser(e.target.checked)}
                className="mt-0.5"
              />
              Chặn người dùng này
            </label>
          </div>
        ) : null}

        {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="cursor-pointer rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {submitting ? "Đang gửi..." : "Gửi báo cáo"}
          </button>
        </div>
      </div>
    </div>
  );
}
