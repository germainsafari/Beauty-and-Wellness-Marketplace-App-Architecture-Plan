import { useMemo, useState } from "react";
import { Calendar, Clock, X } from "lucide-react";
import { formatPrice, trpcCall } from "../lib/api";

type ServiceInfo = {
  id: number;
  name: string;
  price: string;
  duration: number;
  providerName?: string;
};

type Props = {
  service: ServiceInfo | null;
  onClose: () => void;
  onBooked?: () => void;
};

function buildTimeSlots() {
  const slots: string[] = [];
  for (let h = 8; h <= 18; h++) {
    for (const m of [0, 30]) {
      if (h === 18 && m > 0) break;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

function buildDates(count = 14) {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 0) dates.push(d);
  }
  return dates;
}

export default function BookingModal({ service, onClose, onBooked }: Props) {
  const dates = useMemo(() => buildDates(), []);
  const timeSlots = useMemo(() => buildTimeSlots(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!service) return null;

  const book = async () => {
    setBusy(true);
    setError("");
    try {
      const [h, m] = selectedTime.split(":").map(Number);
      const scheduled = new Date(selectedDate);
      scheduled.setHours(h, m, 0, 0);
      await trpcCall(
        "bookings.create",
        { serviceId: service.id, scheduledAt: scheduled.toISOString(), notes: notes || undefined },
        "mutation"
      );
      onBooked?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not book appointment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between rounded-t-3xl">
          <div>
            <p className="text-xs font-bold text-hafi-purple uppercase tracking-wide">Book appointment</p>
            <h2 className="text-xl font-black font-display mt-0.5">{service.name}</h2>
            {service.providerName && <p className="text-sm text-gray-500">{service.providerName}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between bg-hafi-bg rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={18} className="text-hafi-purple" />
              {service.duration} min
            </div>
            <p className="text-2xl font-black text-hafi-purple">{formatPrice(service.price)}</p>
          </div>

          <div>
            <p className="text-sm font-bold flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-hafi-purple" /> Pick a date
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {dates.map((d) => {
                const active = d.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => setSelectedDate(d)}
                    className={`flex-shrink-0 flex flex-col items-center w-16 py-3 rounded-2xl border-2 transition-all ${
                      active
                        ? "border-hafi-purple bg-purple-50 text-hafi-purple"
                        : "border-gray-100 hover:border-purple-200"
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase text-gray-400">
                      {d.toLocaleDateString("en", { weekday: "short" })}
                    </span>
                    <span className="text-lg font-black">{d.getDate()}</span>
                    <span className="text-[10px] text-gray-400">{d.toLocaleDateString("en", { month: "short" })}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold flex items-center gap-2 mb-3">
              <Clock size={16} className="text-hafi-purple" /> Pick a time
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {timeSlots.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    selectedTime === t
                      ? "bg-hafi-purple text-white shadow-md"
                      : "bg-gray-50 text-gray-600 hover:bg-purple-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold block mb-2">Notes for provider (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, preferences, parking info..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none h-20 outline-none focus:border-hafi-purple"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            onClick={book}
            disabled={busy}
            className="w-full bg-gradient-to-r from-hafi-purple to-violet-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-shadow disabled:opacity-60"
          >
            {busy ? "Booking..." : "Confirm booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
