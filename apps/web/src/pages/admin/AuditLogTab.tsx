import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { trpcCall } from "../../lib/api";
import { DataTable, EmptyState, SectionCard, formatDateTime } from "./shared";

type ActionRow = {
  id: number;
  action: string;
  targetType: string;
  targetId: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  adminId: number;
  adminName: string;
};

function summarizeMetadata(metadata: ActionRow["metadata"]): string {
  if (!metadata) return "—";
  const parts = Object.entries(metadata)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${String(v)}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export default function AuditLogTab() {
  const [rows, setRows] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trpcCall<ActionRow[]>("admin.actions")
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SectionCard title="Audit Log" icon={<ScrollText className="text-hafi-purple" />}>
      {rows.length === 0 ? (
        <EmptyState label={loading ? "Loading…" : "No admin actions recorded yet."} />
      ) : (
        <DataTable headers={["When", "Admin", "Action", "Target", "Details"]}>
          {rows.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50/60">
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(a.createdAt)}</td>
              <td className="px-4 py-3 font-bold whitespace-nowrap">{a.adminName}</td>
              <td className="px-4 py-3">
                <span className="inline-block text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-purple-100 text-hafi-purple whitespace-nowrap">
                  {a.action.replace(/_/g, " ")}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {a.targetType.replace(/_/g, " ")} #{a.targetId}
              </td>
              <td className="px-4 py-3 text-gray-500">{summarizeMetadata(a.metadata)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </SectionCard>
  );
}
