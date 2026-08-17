const STATUS_STYLES: Record<string, { bg: string; dot: string; label: string }> = {
  HEALTHY: { bg: "bg-forest-700/10 text-forest-800", dot: "bg-forest-700", label: "Healthy" },
  AT_RISK: { bg: "bg-amber/15 text-amber-800", dot: "bg-amber", label: "At Risk" },
  VERIFICATION_DUE: { bg: "bg-orange-500/10 text-orange-700", dot: "bg-orange-500", label: "Verification Due" },
  DEAD: { bg: "bg-red/10 text-red-700", dot: "bg-red", label: "Dead" },
  MISSING: { bg: "bg-red/10 text-red-700", dot: "bg-red", label: "Missing" },
  REPLACED: { bg: "bg-stone/10 text-stone", dot: "bg-stone", label: "Replaced" },
};

export function statusColor(status: string) {
  return STATUS_STYLES[status]?.dot || "bg-stone";
}

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || { bg: "bg-stone/10 text-stone", dot: "bg-stone", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
