import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import ProviderCard from "../../components/ProviderCard";
import BookingModal from "../../components/BookingModal";
import { formatPrice, trpcCall } from "../../lib/api";

type Category = { id: number; name: string; icon: string | null };
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
  service: { id: number; name: string; price: string; duration: number };
  provider: { businessName: string; id: number };
  category: Category | null;
};

export default function DiscoverPage() {
  const [searchParams] = useSearchParams();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [nearMe, setNearMe] = useState(true);
  const [view, setView] = useState<"providers" | "services">("providers");
  const [bookingService, setBookingService] = useState<{
    id: number;
    name: string;
    price: string;
    duration: number;
    providerName?: string;
  } | null>(null);

  useEffect(() => {
    trpcCall<Provider[]>("discovery.nearbyProviders", { latitude: -1.9441, longitude: 30.0619 })
      .then(setProviders)
      .catch(() => {});
    trpcCall<ServiceRow[]>("bookings.services").then(setServices).catch(() => {});
    trpcCall<Category[]>("discovery.categories").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("category");
    if (fromUrl) setCategory(fromUrl);
  }, [searchParams]);

  const sortedProviders = useMemo(() => {
    let list = nearMe
      ? [...providers].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
      : providers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.profile.businessName.toLowerCase().includes(q) ||
          p.profile.description?.toLowerCase().includes(q) ||
          p.profile.address.toLowerCase().includes(q)
      );
    }
    return list;
  }, [providers, nearMe, search]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchSearch =
        !search ||
        s.service.name.toLowerCase().includes(search.toLowerCase()) ||
        s.provider.businessName.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        category === "all" ||
        s.category?.name.toLowerCase() === category.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [services, search, category]);

  const categoryPills = [{ id: 0, name: "all", icon: "✨" }, ...categories];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black font-display">Discover</h1>
        <p className="text-gray-500 mt-1">
          Book beauty, wellness, home & local services near you — Booksy-style.
        </p>
      </div>

      {/* Search & filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-3 bg-hafi-bg rounded-xl px-4 py-3">
            <Search className="text-gray-400 flex-shrink-0" size={20} />
            <input
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Search salons, lash bars, massage, electricians..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setNearMe((v) => !v)}
              className={`px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap ${
                nearMe ? "bg-hafi-purple text-white" : "bg-gray-50 text-gray-600 border"
              }`}
            >
              📍 Near me
            </button>
            <div className="flex rounded-xl border overflow-hidden">
              {(["providers", "services"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-3 text-sm font-bold capitalize ${
                    view === v ? "bg-hafi-purple text-white" : "bg-white text-gray-600"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categoryPills.map((c) => (
            <button
              key={c.name}
              onClick={() => setCategory(c.name.toLowerCase())}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                category === c.name.toLowerCase()
                  ? "bg-hafi-purple text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-purple-50"
              }`}
            >
              <span>{c.icon}</span>
              <span className="capitalize">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {view === "providers" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedProviders.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400">
              <SlidersHorizontal className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No providers found. Run <code className="text-hafi-purple">npm run db:seed:extra</code> for demo data.</p>
            </div>
          ) : (
            sortedProviders.map((p) => (
              <ProviderCard
                key={p.profile.id}
                provider={p}
                categoryFilter={category}
                onBook={setBookingService}
              />
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400">
              <p>No services match your filters</p>
            </div>
          ) : (
            filteredServices.map(({ service, provider, category: cat }) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{cat?.icon ?? "✨"}</span>
                  <div>
                    <p className="font-bold text-lg leading-tight">{service.name}</p>
                    <p className="text-sm text-hafi-purple font-semibold">{provider.businessName}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-3">{service.duration} min</p>
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <span className="font-black text-hafi-purple text-xl">{formatPrice(service.price)}</span>
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
                    className="bg-hafi-purple text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-hafi-mid"
                  >
                    Book now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {bookingService && (
        <BookingModal
          service={bookingService}
          onClose={() => setBookingService(null)}
          onBooked={() => {}}
        />
      )}
    </div>
  );
}
