import { useEffect, useState } from "react";
import { formatPrice, trpcCall } from "../../lib/api";

export default function MerchantAnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    trpcCall("merchant.dashboard").then(setData).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black font-display">Analytics</h1>
      <p className="text-gray-500">Booksy Stats & Reports — revenue, occupancy, performance</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Week revenue", value: data ? formatPrice(data.weekRevenue) : "—" },
          { label: "Today's bookings", value: data?.todayAppointments ?? "—" },
          { label: "Active listings", value: data?.activeListings ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl p-6 border shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-black mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-8 border h-64 flex items-center justify-center text-gray-400">
        Revenue chart — connect to live analytics in production
      </div>
    </div>
  );
}
