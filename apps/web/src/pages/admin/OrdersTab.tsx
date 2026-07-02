import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { formatPrice, trpcCall } from "../../lib/api";
import { DataTable, EmptyState, SectionCard, StatusBadge, formatDateTime } from "./shared";

type OrderRow = {
  id: number;
  totalAmount: string;
  status: string;
  createdAt: string;
  buyerName: string;
  sellerName: string;
  listingTitle: string;
  paymentStatus: string | null;
};

export default function OrdersTab() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trpcCall<OrderRow[]>("admin.orders")
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SectionCard title="Orders" icon={<Package className="text-hafi-purple" />}>
      {rows.length === 0 ? (
        <EmptyState label={loading ? "Loading…" : "No orders yet."} />
      ) : (
        <DataTable headers={["Order", "Item", "Buyer", "Seller", "Total", "Payment", "Status", "Created"]}>
          {rows.map((o) => (
            <tr key={o.id} className="hover:bg-gray-50/60">
              <td className="px-4 py-3 font-bold">#{o.id}</td>
              <td className="px-4 py-3">{o.listingTitle}</td>
              <td className="px-4 py-3 whitespace-nowrap">{o.buyerName}</td>
              <td className="px-4 py-3 whitespace-nowrap">{o.sellerName}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatPrice(o.totalAmount)}</td>
              <td className="px-4 py-3">
                <StatusBadge value={o.paymentStatus} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge value={o.status} />
              </td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </SectionCard>
  );
}
