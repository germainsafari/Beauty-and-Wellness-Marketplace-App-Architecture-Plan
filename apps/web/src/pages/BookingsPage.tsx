import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { formatPrice, trpcCall } from "../lib/api";

type Service = {
  service: { id: number; name: string; description: string | null; duration: number; price: string };
  provider: { businessName: string; rating: string; address: string };
  category: { icon: string | null } | null;
};

type Booking = { id: number; serviceName: string; providerName: string; scheduledAt: string; status: string };

export default function BookingsPage() {
  const [tab, setTab] = useState<"book" | "mine">("book");
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [msg, setMsg] = useState("");

  const load = () => {
    trpcCall<Service[]>("bookings.services").then(setServices).catch(() => {});
    trpcCall<Booking[]>("bookings.mine").then(setBookings).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const book = async (serviceId: number, name: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    try {
      await trpcCall("bookings.create", { serviceId, scheduledAt: tomorrow.toISOString() }, "mutation");
      setMsg(`Booked ${name}! ✨`);
      setTab("mine");
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Booking failed");
    }
  };

  return (
    <div>
      <div className="bg-white px-4 pt-6 pb-4 rounded-b-3xl">
        <h1 className="text-2xl font-black font-display">Bookings</h1>
        <p className="text-gray-400 text-sm mb-4">Salon & wellness services 💆‍♀️</p>
        <div className="flex bg-hafi-bg rounded-xl p-1">
          {(["book", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${tab === t ? "bg-white text-hafi-purple shadow-sm" : "text-gray-400"}`}
            >
              {t === "book" ? "Discover" : "My Bookings"}
            </button>
          ))}
        </div>
      </div>

      {msg && <p className="text-center text-emerald-600 text-sm font-semibold py-2">{msg}</p>}

      <div className="p-4 space-y-3">
        {tab === "book"
          ? services.map(({ service, provider, category }) => (
              <div key={service.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex gap-3 mb-3">
                  <span className="text-3xl">{category?.icon || "✨"}</span>
                  <div>
                    <p className="font-bold">{service.name}</p>
                    <p className="text-hafi-purple text-sm font-semibold">{provider.businessName}</p>
                    <p className="text-xs text-gray-400">⭐ {provider.rating} · {service.duration} min · {provider.address}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-lg font-black text-hafi-purple">{formatPrice(service.price)}</p>
                  <button onClick={() => book(service.id, service.name)} className="bg-hafi-purple text-white font-bold px-5 py-2.5 rounded-xl text-sm">Book Now</button>
                </div>
              </div>
            ))
          : bookings.length === 0
            ? (
              <div className="text-center py-16 text-gray-400">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-200" />
                <p className="font-semibold">No bookings yet</p>
              </div>
            )
            : bookings.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><Sparkles className="w-6 h-6 text-hafi-purple" /></div>
                  <div className="flex-1">
                    <p className="font-bold">{b.serviceName}</p>
                    <p className="text-xs text-gray-400">{b.providerName}</p>
                    <p className="text-xs text-hafi-purple font-semibold mt-1">{new Date(b.scheduledAt).toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full capitalize">{b.status}</span>
                </div>
              ))}
      </div>
    </div>
  );
}
