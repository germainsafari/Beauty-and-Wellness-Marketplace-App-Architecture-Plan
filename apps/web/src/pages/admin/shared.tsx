import type { ReactNode } from "react";
import { getApiUrl } from "../../lib/api";

/** Uploaded documents live on the API origin; the Vite proxy only covers /trpc. */
export function resolveUploadUrl(url: string): string {
  if (url.startsWith("/uploads/")) {
    return `${getApiUrl() || "http://localhost:3001"}${url}`;
  }
  return url;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  approved: "bg-emerald-100 text-emerald-700",
  completed: "bg-emerald-100 text-emerald-700",
  succeeded: "bg-emerald-100 text-emerald-700",
  paid: "bg-emerald-100 text-emerald-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  ready_for_pickup: "bg-blue-100 text-blue-700",
  reserved: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  pending_payment: "bg-amber-100 text-amber-700",
  sold: "bg-gray-200 text-gray-600",
  removed: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
  disputed: "bg-orange-100 text-orange-700",
  refunded: "bg-orange-100 text-orange-700",
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-xs text-gray-400">—</span>;
  const style = STATUS_STYLES[value] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block text-[11px] font-bold uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${style}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

export function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-5 border-b flex items-center gap-2">
        {icon}
        <h2 className="font-black text-lg">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b bg-gray-50/60">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-bold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return <p className="p-6 text-sm text-gray-400">{label}</p>;
}
