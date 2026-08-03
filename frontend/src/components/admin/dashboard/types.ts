export type Stat = {
  label: string;
  value: string;
  change: string;
  up?: boolean;
};

export type ReportItem = {
  id: string;
  type: "Post" | "Comment" | "User" | "Group";
  target: string;
  reason: string;
  status: "New" | "Reviewing" | "Resolved";
  statusLabel: string;
  createdAt: string;
  createdAtIso?: string;
  reporterUserId?: number;
  targetAuthorUserId?: number;
};

export type QueueItem = {
  id: string;
  title: string;
  author: string;
  risk: "High" | "Medium" | "Low";
  createdAt: string;
};