"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "../../components/admin/dashboard/DashboardHeader";
import GrowthCard from "../../components/admin/dashboard/GrowthCard";
import ModerationQueueCard from "../../components/admin/dashboard/ModerationQueueCard";
import ReportsTable from "../../components/admin/dashboard/ReportsTable";
import StatsGrid from "../../components/admin/dashboard/StatsGrid";
import type { QueueItem, ReportItem, Stat } from "../../components/admin/dashboard/types";

const stats: Stat[] = [
  { label: "Người dùng hoạt động", value: "18,420", change: "+8.1%", up: true },
  { label: "Bài viết hôm nay", value: "2,946", change: "+3.4%", up: true },
  { label: "Báo cáo vi phạm", value: "132", change: "-12.5%", up: true },
  { label: "Tỉ lệ giữ chân 7 ngày", value: "41.8%", change: "-1.2%", up: false },
];

const moderationQueue: QueueItem[] = [
  { id: "Q-1001", title: "Bài viết chứa từ ngữ nhạy cảm", author: "nguyenvana", risk: "High", createdAt: "10:12" },
  { id: "Q-1002", title: "Ảnh có dấu hiệu spam quảng cáo", author: "thuylinh", risk: "Medium", createdAt: "10:05" },
  { id: "Q-1003", title: "Bình luận công kích cá nhân", author: "tuantran", risk: "High", createdAt: "09:58" },
  { id: "Q-1004", title: "Bài chia sẻ liên kết lạ", author: "hoangminh", risk: "Low", createdAt: "09:46" },
];

const reports: ReportItem[] = [
  { id: "R-5532", type: "Post", target: "post_91022", reason: "Nội dung phản cảm", status: "New", createdAt: "2 phút trước" },
  { id: "R-5531", type: "Comment", target: "cmt_77291", reason: "Công kích cá nhân", status: "Reviewing", createdAt: "12 phút trước" },
  { id: "R-5530", type: "User", target: "user_4219", reason: "Spam hàng loạt", status: "Reviewing", createdAt: "19 phút trước" },
  { id: "R-5529", type: "Post", target: "post_90901", reason: "Tin giả", status: "Resolved", createdAt: "35 phút trước" },
];

export default function AdminDashboardPage() {
  const [query, setQuery] = useState("");
  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.target.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
    );
  }, [query]);

  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  }

  return (
    <section className="space-y-5">
      <DashboardHeader query={query} setQuery={setQuery} />
      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        <GrowthCard />
        <ModerationQueueCard items={moderationQueue} />
      </div>

      <ReportsTable reports={filteredReports} />
    </section>
  );
}