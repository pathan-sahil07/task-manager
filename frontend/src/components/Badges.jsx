export const STATUS_CONFIG = {
  TODO: { label: "To Do", color: "bg-slate-700 text-slate-300" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-900/60 text-blue-300" },
  IN_REVIEW: { label: "In Review", color: "bg-yellow-900/60 text-yellow-300" },
  DONE: { label: "Done", color: "bg-green-900/60 text-green-300" },
};

export const PRIORITY_CONFIG = {
  LOW: { label: "Low", color: "bg-slate-700 text-slate-400" },
  MEDIUM: { label: "Medium", color: "bg-blue-900/60 text-blue-300" },
  HIGH: { label: "High", color: "bg-orange-900/60 text-orange-300" },
  URGENT: { label: "Urgent", color: "bg-red-900/60 text-red-300" },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.TODO;
  return <span className={`badge ${cfg.color}`}>{cfg.label}</span>;
}

export function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  return <span className={`badge ${cfg.color}`}>{cfg.label}</span>;
}
