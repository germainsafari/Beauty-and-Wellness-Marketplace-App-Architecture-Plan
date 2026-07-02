import { useEffect, useState } from "react";
import { ChevronDown, MapPin, Star } from "lucide-react";
import { formatPrice, trpcCall } from "../lib/api";

type Provider = {
  profile: {
    id: number;
    businessName: string;
    address: string;
    rating: string;
    reviewCount: number;
    description: string | null;
    latitude: string | null;
    longitude: string | null;
  };
  user: { id: number; name: string; avatarUrl: string | null; isVerified: boolean };
  distanceKm: number | null;
};

type ServiceRow = {
  service: { id: number; name: string; price: string; duration: number; description: string | null };
  category: { id: number; name: string; icon: string | null } | null;
};

type Props = {
  provider: Provider;
  onBook: (service: { id: number; name: string; price: string; duration: number; providerName: string }) => void;
  categoryFilter?: string;
};

export default function ProviderCard({ provider, onBook, categoryFilter }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const { profile, user, distanceKm } = provider;

  useEffect(() => {
    if (expanded && services.length === 0) {
      trpcCall<ServiceRow[]>("discovery.providerServices", { providerId: profile.id })
        .then(setServices)
        .catch(() => {});
    }
  }, [expanded, profile.id, services.length]);

  const filtered = categoryFilter && categoryFilter !== "all"
    ? services.filter((s) => s.category?.name.toLowerCase() === categoryFilter.toLowerCase())
    : services;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-100" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-hafi-purple to-hafi-light text-white flex items-center justify-center text-xl font-black">
              {user.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg flex items-center gap-2 flex-wrap">
              {profile.businessName}
              {user.isVerified && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  Verified
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin size={14} className="flex-shrink-0" />
              <span className="truncate">{profile.address}</span>
            </p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <p className="text-sm flex items-center gap-1">
                <Star size={14} className="text-hafi-gold fill-hafi-gold" />
                <span className="font-bold">{profile.rating}</span>
                <span className="text-gray-400">({profile.reviewCount})</span>
              </p>
              {distanceKm !== null && (
                <span className="text-xs font-bold text-hafi-purple bg-purple-50 px-2 py-0.5 rounded-full">
                  {distanceKm} km away
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 mt-4">{profile.description || "Professional local services"}</p>
      </div>

      <div className="border-t border-gray-50">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full px-5 py-3 flex items-center justify-between text-sm font-bold text-hafi-purple hover:bg-purple-50/50 transition-colors"
        >
          View services & book
          <ChevronDown size={18} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <div className="px-5 pb-5 space-y-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">Loading services...</p>
            ) : (
              filtered.map(({ service, category }) => (
                <div
                  key={service.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-hafi-bg hover:bg-purple-50 transition-colors"
                >
                  <span className="text-xl">{category?.icon ?? "✨"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{service.name}</p>
                    <p className="text-xs text-gray-400">{service.duration} min</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-hafi-purple text-sm">{formatPrice(service.price)}</p>
                    <button
                      onClick={() =>
                        onBook({
                          id: service.id,
                          name: service.name,
                          price: service.price,
                          duration: service.duration,
                          providerName: profile.businessName,
                        })
                      }
                      className="mt-1 text-xs font-bold bg-hafi-purple text-white px-3 py-1 rounded-lg hover:bg-hafi-mid"
                    >
                      Book
                    </button>
                  </div>
                </div>
              ))
            )}
            {profile.latitude && profile.longitude && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${profile.latitude},${profile.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-xs font-bold text-hafi-purple mt-2"
              >
                Open in Google Maps →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
