import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatPrice, trpcCall } from "../../lib/api";
import { DataTable, EmptyState, SectionCard, StatusBadge, formatDateTime } from "./shared";

type BookingRow = {
  id: number;
  scheduledAt: string;
  status: string;
  totalAmount: string;
  clientId: number;
  clientName: string;
  providerName: string;
  serviceName: string;
  createdAt: string;
};

export default function BookingsTab() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trpcCall<BookingRow[]>("admin.bookings")
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SectionCard title="Bookings" icon={<CalendarDays className="text-hafi-purple" />}>
      {rows.length === 0 ? (
        <EmptyState label={loading ? "Loading…" : "No bookings yet."} />
      ) : (
        <DataTable headers={["Service", "Client", "Provider", "Scheduled", "Amount", "Status"]}>
          {rows.map((b) => (
            <tr key={b.id} className="hover:bg-gray-50/60">
              <td className="px-4 py-3 font-bold">{b.serviceName}</td>
              <td className="px-4 py-3 whitespace-nowrap">{b.clientName}</td>
              <td className="px-4 py-3 whitespace-nowrap">{b.providerName}</td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(b.scheduledAt)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatPrice(b.totalAmount)}</td>
              <td className="px-4 py-3">
                <StatusBadge value={b.status} />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </SectionCard>
  );
}
