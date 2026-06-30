import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { formatPrice, trpcCall } from "../../lib/api";

export default function ClientBookingsPage() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    trpcCall("bookings.mine").then(setBookings).catch(() => {});
    trpcCall("bookings.services").then(setServices).catch(() => {});
  }, []);

  const book = async (serviceId: number) => {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0);
    await trpcCall("bookings.create", { serviceId, scheduledAt: d.toISOString() }, "mutation");
    trpcCall("bookings.mine").then(setBookings);
  };

  const filtered = bookings.filter((b) => tab === "upcoming" ? new Date(b.scheduledAt) >= new Date() : new Date(b.scheduledAt) < new Date());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black font-display">My Bookings</h1>
        <p className="text-gray-500">Manage appointments — reschedule & rebook like Booksy</p>
      </div>

      <div className="flex gap-2">
        {(["upcoming", "past"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-full text-sm font-bold capitalize ${tab === t ? "bg-hafi-purple text-white" : "bg-white border"}`}>{t}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400"><Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No {tab} bookings</p></div>
        ) : filtered.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl p-5 border shadow-sm flex gap-4">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center"><Sparkles className="text-hafi-purple" /></div>
            <div className="flex-1">
              <p className="font-bold">{b.serviceName}</p>
              <p className="text-sm text-gray-500">{b.providerName}</p>
              <p className="text-sm text-hafi-purple font-semibold mt-1">{new Date(b.scheduledAt).toLocaleString()}</p>
              <div className="flex gap-2 mt-3">
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full capitalize">{b.status}</span>
                {tab === "upcoming" && <button onClick={() => trpcCall("bookings.cancel", { id: b.id }, "mutation").then(() => trpcCall("bookings.mine").then(setBookings))} className="text-xs text-red-500 font-semibold">Cancel</button>}
                {tab === "past" && <button className="text-xs text-hafi-purple font-semibold">Rebook</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-black mb-4">Book a new service</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map(({ service, provider }: any) => (
            <div key={service.id} className="bg-white rounded-2xl p-5 border flex flex-col">
              <p className="font-bold">{service.name}</p>
              <p className="text-sm text-hafi-purple">{provider.businessName}</p>
              <p className="font-black text-lg mt-auto pt-4">{formatPrice(service.price)}</p>
              <button onClick={() => book(service.id)} className="mt-3 bg-hafi-purple text-white font-bold py-2.5 rounded-xl text-sm">Book now</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
