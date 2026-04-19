interface StatCardProps {
  label: string;
  value: string | number;
  /** Optional color accent for the value: "blue" | "yellow" | "green" | "red" | "gray" */
  color?: "blue" | "yellow" | "green" | "red" | "gray";
  /** If true, renders with a blue left border accent (primary card style) */
  primary?: boolean;
}

const colorMap: Record<string, string> = {
  blue:   "text-blue-600",
  yellow: "text-amber-500",
  green:  "text-emerald-600",
  red:    "text-red-500",
  gray:   "text-gray-700",
};

/**
 * Reusable metric card for dashboards.
 * Used in admin-panel and my-bookings stat bars.
 *
 * Usage:
 *   <StatCard label="Pending" value={12} color="yellow" />
 *   <StatCard label="Total Bookings" value={42} primary />
 */
export default function StatCard({ label, value, color = "gray", primary = false }: StatCardProps) {
  return (
    <div
      className={`rounded-xl bg-white p-4 shadow-sm border ${
        primary ? "border-l-4 border-l-blue-600 border-gray-200" : "border-gray-200"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );
}
