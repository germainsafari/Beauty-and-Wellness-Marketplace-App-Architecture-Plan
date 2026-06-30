import { useEffect, useState } from "react";
import { trpcCall } from "../../lib/api";

export default function MerchantCalendarPage() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    trpcCall("merchant.calendar").then(setBookings).catch(() => {});
  }, []);

  const confirm = (id: number, status: string) => {
    trpcCall("merchant.updateBookingStatus", { id, status }, "mutation").then(() =>
      trpcCall("merchant.calendar").then(setBookings)
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black font-display">Calendar</h1>
      <p className="text-gray-500">Today's schedule & upcoming appointments</p>

      <div className="space-y-3">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border">No appointments scheduled</div>
        ) : bookings.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl p-5 border shadow-sm flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <p className="font-bold text-lg">{b.serviceName}</p>
              <p className="text-sm text-gray-600">{b.customerName}{b.customerPhone ? ` · ${b.customerPhone}` : ""}</p>
              <p className="text-hafi-purple font-semibold">{new Date(b.scheduledAt).toLocaleString()}</p>
              <span className="inline-block mt-2 text-xs font-bold bg-purple-100 text-hafi-purple px-3 py-1 rounded-full capitalize">{b.status}</span>
            </div>
            {b.status === "pending" && (
              <div className="flex gap-2">
                <button onClick={() => confirm(b.id, "confirmed")} className="bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-sm">Confirm</button>
                <button onClick={() => confirm(b.id, "cancelled")} className="border text-red-500 font-bold px-4 py-2 rounded-xl text-sm">Decline</button>
              </div>
            )}
            {b.status === "confirmed" && (
              <button onClick={() => confirm(b.id, "completed")} className="bg-hafi-purple text-white font-bold px-4 py-2 rounded-xl text-sm">Mark complete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
