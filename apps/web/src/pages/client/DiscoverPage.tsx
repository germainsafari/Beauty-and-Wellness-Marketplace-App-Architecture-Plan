import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Search, Star } from "lucide-react";
import { formatPrice, trpcCall } from "../../lib/api";

type Provider = {
  profile: { id: number; businessName: string; address: string; rating: string; reviewCount: number; description: string | null };
  user: { id: number; name: string; avatarUrl: string | null; isVerified: boolean };
};

type Service = {
  service: { id: number; name: string; price: string; duration: number };
  provider: { businessName: string };
};

export default function DiscoverPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    trpcCall<Provider[]>("bookings.providers").then(setProviders).catch(() => {});
    trpcCall<Service[]>("bookings.services").then(setServices).catch(() => {});
  }, []);

  const cats = ["all", "hair", "nails", "makeup", "skincare", "massage"];

  const filtered = services.filter((s) => {
    const matchSearch = !search || s.service.name.toLowerCase().includes(search.toLowerCase()) || s.provider.businessName.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || s.service.name.toLowerCase().includes(category);
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black font-display">Discover</h1>
        <p className="text-gray-500 mt-1">Find salons & wellness pros near you — Booksy style</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
          <Search className="text-gray-400" size={20} />
          <input className="flex-1 outline-none" placeholder="Search services or salons..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold capitalize ${
                category === c ? "bg-hafi-purple text-white" : "bg-white text-gray-600 border"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {providers.map(({ profile, user }) => (
          <div key={profile.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-hafi-purple to-hafi-light text-white flex items-center justify-center text-xl font-black">
                {user.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  {profile.businessName}
                  {user.isVerified && <span className="text-xs bg-purple-100 text-hafi-purple px-2 py-0.5 rounded-full">Verified</span>}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={14} />{profile.address}</p>
                <p className="text-sm flex items-center gap-1 mt-1"><Star size={14} className="text-hafi-gold fill-hafi-gold" />{profile.rating} ({profile.reviewCount})</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{profile.description || "Professional beauty services"}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-black mb-4">Available services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ service, provider }) => (
            <div key={service.id} className="bg-white rounded-2xl p-5 border border-gray-50 shadow-sm flex flex-col">
              <p className="font-bold text-lg">{service.name}</p>
              <p className="text-hafi-purple text-sm font-semibold">{provider.businessName}</p>
              <p className="text-gray-400 text-sm mt-1">{service.duration} min</p>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="font-black text-hafi-purple text-lg">{formatPrice(service.price)}</span>
                <Link to="/client/bookings" className="bg-hafi-purple text-white text-sm font-bold px-4 py-2 rounded-xl">Book</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
