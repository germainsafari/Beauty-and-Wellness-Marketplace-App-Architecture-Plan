import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { formatPrice, trpcCall } from "../lib/api";

type Listing = { id: number; title: string; price: string; condition: string; images: string[]; location: string | null; isBumped: boolean; likes: number };

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const t = setTimeout(() => {
      trpcCall<Listing[]>("listings.list", { search: search || undefined, limit: 30 })
        .then((items) => {
          let sorted = [...items];
          if (filter === "Trending") sorted.sort((a, b) => b.likes - a.likes);
          setListings(sorted);
        })
        .catch(() => setListings([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search, filter]);

  return (
    <div>
      <div className="bg-white px-4 pt-6 pb-4 rounded-b-3xl shadow-sm">
        <h1 className="text-2xl font-black font-display">Marketplace</h1>
        <p className="text-gray-400 text-sm mb-4">Pre-loved beauty gems 💎</p>
        <div className="flex items-center gap-2 bg-hafi-bg rounded-xl px-4 py-3 mb-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Search makeup, skincare, tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {["All", "Trending", "New"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                filter === f ? "bg-hafi-purple text-white" : "bg-hafi-bg text-gray-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {listings.map((item) => (
          <Link key={item.id} to={`/marketplace/${item.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:scale-[1.02] transition-all">
            <div className="aspect-[4/5] bg-purple-50 relative">
              {item.images?.[0] ? (
                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">✨</div>
              )}
              {item.condition === "new" && <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>}
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold line-clamp-2">{item.title}</p>
              <p className="text-sm font-black text-hafi-purple mt-1">{formatPrice(item.price)}</p>
              <p className="text-[10px] text-gray-400 mt-1">📍 {item.location || "Rwanda"}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
