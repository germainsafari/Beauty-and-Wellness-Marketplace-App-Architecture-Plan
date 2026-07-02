import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, RotateCcw, Sparkles, XCircle } from "lucide-react";
import BookingModal from "../../components/BookingModal";
import { formatPrice, trpcCall } from "../../lib/api";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-600",
  no_show: "bg-gray-100 text-gray-600",
};

export default function ClientBookingsPage() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [bookingService, setBookingService] = useState<{
    id: number;
    name: string;
    price: string;
    duration: number;
    providerName?: string;
  } | null>(null);

  const refresh = () => {
    trpcCall<any[]>("bookings.mine").then(setBookings).catch(() => {});
    trpcCall<any[]>("bookings.services").then(setServices).catch(() => {});
  };

  useEffect(() => {
    refresh();
  }, []);

  const now = new Date();
  const filtered = bookings.filter((b) =>
    tab === "upcoming" ? new Date(b.scheduledAt) >= now && b.status !== "cancelled" : new Date(b.scheduledAt) < now || b.status === "cancelled"
  );

  const upcomingCount = bookings.filter((b) => new Date(b.scheduledAt) >= now && b.status !== "cancelled").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display">My Bookings</h1>
          <p className="text-gray-500 mt-1">Booksy-style appointment management — view, cancel, or rebook.</p>
        </div>
        {upcomingCount > 0 && (
          <div className="bg-purple-50 text-hafi-purple font-bold px-5 py-2.5 rounded-xl text-sm">
            {upcomingCount} upcoming appointment{upcomingCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold capitalize transition-all ${
              tab === t ? "bg-hafi-purple text-white shadow-md" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-200" />
            <p className="text-gray-500 font-medium">No {tab} bookings yet</p>
            <p className="text-sm text-gray-400 mt-1">Browse services below to book your first appointment</p>
          </div>
        ) : (
          filtered.map((b) => {
            const date = new Date(b.scheduledAt);
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1.5 bg-gradient-to-r from-hafi-purple to-hafi-light" />
                <div className="p-5 flex gap-4">
                  <div className="flex-shrink-0 w-16 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase">{date.toLocaleDateString("en", { month: "short" })}</p>
                    <p className="text-3xl font-black text-hafi-purple leading-none">{date.getDate()}</p>
                    <p className="text-xs text-gray-400">{date.toLocaleDateString("en", { weekday: "short" })}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate">{b.serviceName}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={14} /> {b.providerName}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-hafi-purple" />
                        {date.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="font-bold text-hafi-purple">{formatPrice(b.totalAmount)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${STATUS_STYLE[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {b.status.replace("_", " ")}
                      </span>
                      {tab === "upcoming" && b.status !== "cancelled" && (
                        <button
                          onClick={() =>
                            trpcCall("bookings.cancel", { id: b.id }, "mutation").then(refresh)
                          }
                          className="text-xs text-red-500 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                      )}
                      {(tab === "past" || b.status === "completed") && (
                        <button
                          onClick={() => {
                            const svc = services.find((s) => s.service.name === b.serviceName);
                            if (svc) {
                              setBookingService({
                                id: svc.service.id,
                                name: svc.service.name,
                                price: svc.service.price,
                                duration: svc.service.duration,
                                providerName: svc.provider.businessName,
                              });
                            }
                          }}
                          className="text-xs text-hafi-purple font-semibold flex items-center gap-1 hover:underline"
                        >
                          <RotateCcw size={14} /> Rebook
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div>
        <h2 className="text-xl font-black mb-1 flex items-center gap-2">
          <Calendar size={22} className="text-hafi-purple" /> Book a new service
        </h2>
        <p className="text-sm text-gray-500 mb-4">Pick a service and choose your preferred date & time</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map(({ service, provider, category }: any) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{category?.icon ?? "✨"}</span>
                <div>
                  <p className="font-bold">{service.name}</p>
                  <p className="text-sm text-hafi-purple">{provider.businessName}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{service.duration} min</p>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <p className="font-black text-lg text-hafi-purple">{formatPrice(service.price)}</p>
                <button
                  onClick={() =>
                    setBookingService({
                      id: service.id,
                      name: service.name,
                      price: service.price,
                      duration: service.duration,
                      providerName: provider.businessName,
                    })
                  }
                  className="bg-hafi-purple text-white font-bold py-2.5 px-5 rounded-xl text-sm hover:bg-hafi-mid"
                >
                  Book now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {bookingService && (
        <BookingModal service={bookingService} onClose={() => setBookingService(null)} onBooked={refresh} />
      )}
    </div>
  );
}
