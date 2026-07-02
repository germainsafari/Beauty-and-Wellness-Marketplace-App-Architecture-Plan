import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { formatPrice, trpcCall } from "../../lib/api";
import { DataTable, EmptyState, SectionCard, StatusBadge, formatDateTime } from "./shared";

type ListingRow = {
  id: number;
  title: string;
  price: string;
  condition: string;
  status: "active" | "sold" | "reserved" | "removed";
  views: number;
  createdAt: string;
  sellerId: number;
  sellerName: string;
};

export default function ListingsTab({ onChanged }: { onChanged: (message: string) => void }) {
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    trpcCall<ListingRow[]>("admin.listings")
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setStatus = async (listing: ListingRow, status: "active" | "removed") => {
    setBusyId(listing.id);
    try {
      await trpcCall("admin.setListingStatus", { listingId: listing.id, status }, "mutation");
      onChanged(`Listing "${listing.title}" ${status === "removed" ? "removed" : "restored"}.`);
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SectionCard title="Listings" icon={<ShoppingBag className="text-hafi-purple" />}>
      {rows.length === 0 ? (
        <EmptyState label={loading ? "Loading…" : "No listings yet."} />
      ) : (
        <DataTable headers={["Listing", "Seller", "Price", "Views", "Created", "Status", "Actions"]}>
          {rows.map((l) => (
            <tr key={l.id} className="hover:bg-gray-50/60">
              <td className="px-4 py-3">
                <p className="font-bold">{l.title}</p>
                <p className="text-xs text-gray-500 capitalize">{l.condition.replace(/_/g, " ")}</p>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{l.sellerName}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatPrice(l.price)}</td>
              <td className="px-4 py-3">{l.views}</td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
              <td className="px-4 py-3">
                <StatusBadge value={l.status} />
              </td>
              <td className="px-4 py-3">
                {l.status === "removed" ? (
                  <button
                    onClick={() => setStatus(l, "active")}
                    disabled={busyId === l.id}
                    className="rounded-xl px-3 py-1.5 text-xs font-bold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 whitespace-nowrap"
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    onClick={() => setStatus(l, "removed")}
                    disabled={busyId === l.id || l.status === "sold"}
                    className="rounded-xl px-3 py-1.5 text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 whitespace-nowrap"
                  >
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </SectionCard>
  );
}
