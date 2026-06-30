import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Search, Shield, SlidersHorizontal } from "lucide-react";
import { formatPrice, trpcCall } from "../../lib/api";

type Listing = {
  id: number;
  title: string;
  price: string;
  condition: string;
  images: string[];
  location: string | null;
  isBumped: boolean;
  likes: number;
  brand: string | null;
};

export default function ClientMarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"default" | "trending" | "new">("default");
  const [condition, setCondition] = useState("");

  useEffect(() => {
    trpcCall<Listing[]>("listings.list", {
      search: search || undefined,
      condition: condition || undefined,
      limit: 48,
    }).then((items) => {
      let sorted = [...items];
      if (sort === "trending") sorted.sort((a, b) => b.likes - a.likes);
      setListings(sorted);
    }).catch(() => setListings([]));
  }, [search, sort, condition]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display">Marketplace</h1>
          <p className="text-gray-500 flex items-center gap-2 mt-1">
            <Shield size={16} className="text-hafi-purple" /> Vinted-style · Buyer protection on every purchase
          </p>
        </div>
        <Link to="/client/marketplace/sell" className="inline-flex bg-hafi-purple text-white font-bold px-6 py-3 rounded-xl w-fit">
          Sell an item
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-3 bg-hafi-bg rounded-xl px-4 py-3">
            <Search size={18} className="text-gray-400" />
            <input className="flex-1 bg-transparent outline-none" placeholder="Search beauty, skincare, tools..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="border rounded-xl px-4 py-3 text-sm font-medium bg-white">
            <option value="default">Recommended</option>
            <option value="trending">Trending</option>
            <option value="new">Newest</option>
          </select>
          <select value={condition} onChange={(e) => setCondition(e.target.value)} className="border rounded-xl px-4 py-3 text-sm font-medium bg-white">
            <option value="">All conditions</option>
            <option value="new">New</option>
            <option value="like_new">Like new</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {listings.map((item) => (
          <Link key={item.id} to={`/client/marketplace/${item.id}`} className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all">
            <div className="aspect-[3/4] relative bg-purple-50 overflow-hidden">
              {item.images?.[0] ? (
                <img src={item.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">✨</div>
              )}
              {item.isBumped && <span className="absolute top-2 left-2 bg-hafi-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full">HOT</span>}
              <button type="button" className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.preventDefault()}>
                <Heart size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="p-2.5 md:p-3">
              <p className="text-xs md:text-sm font-medium line-clamp-2 leading-snug">{item.title}</p>
              {item.brand && <p className="text-[10px] text-gray-400 mt-0.5">{item.brand}</p>}
              <p className="font-black text-hafi-purple mt-1 text-sm md:text-base">{formatPrice(item.price)}</p>
              <p className="text-[10px] text-gray-400 capitalize mt-0.5">{item.condition.replace("_", " ")}</p>
            </div>
          </Link>
        ))}
      </div>

      {listings.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <SlidersHorizontal className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No items match your filters</p>
        </div>
      )}
    </div>
  );
}
