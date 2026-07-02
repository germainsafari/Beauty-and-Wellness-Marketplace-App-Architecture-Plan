import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Search, Shield, SlidersHorizontal, Tag } from "lucide-react";
import ListingCard, { type ListingCardItem } from "../../components/ListingCard";
import { trpcCall } from "../../lib/api";
import { useApp } from "../../context/AppContext";

export default function ClientMarketplacePage() {
  const { user } = useApp();
  const [listings, setListings] = useState<ListingCardItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"default" | "trending" | "new" | "price_asc" | "price_desc">("default");
  const [condition, setCondition] = useState("");

  const loadListings = useCallback(() => {
    trpcCall<ListingCardItem[]>("listings.list", {
      search: search || undefined,
      condition: condition || undefined,
      limit: 48,
    }).then((items) => {
      let sorted = [...items];
      if (sort === "trending") sorted.sort((a, b) => b.likes - a.likes);
      if (sort === "new") sorted.sort((a, b) => b.id - a.id);
      if (sort === "price_asc") sorted.sort((a, b) => Number(a.price) - Number(b.price));
      if (sort === "price_desc") sorted.sort((a, b) => Number(b.price) - Number(a.price));
      setListings(sorted);
    }).catch(() => setListings([]));
  }, [search, sort, condition]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    if (user) {
      trpcCall<number[]>("listings.myFavoriteIds").then((ids) => setFavoriteIds(new Set(ids))).catch(() => {});
    }
  }, [user]);

  const toggleFavorite = async (listingId: number) => {
    if (!user) return;
    await trpcCall("listings.toggleFavorite", { listingId }, "mutation");
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display">Marketplace</h1>
          <p className="text-gray-500 flex items-center gap-2 mt-1">
            <Shield size={16} className="text-hafi-purple" />
            Pre-loved beauty & wellness — Vinted-style with buyer protection
          </p>
        </div>
        <Link
          to="/client/marketplace/sell"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-hafi-purple to-violet-600 text-white font-bold px-6 py-3 rounded-xl w-fit shadow-md hover:shadow-lg"
        >
          <Tag size={18} /> Sell an item
        </Link>
      </div>

      {/* Vinted-style filter bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-3 bg-hafi-bg rounded-xl px-4 py-3">
            <Search size={18} className="text-gray-400" />
            <input
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Search brands, products, tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium bg-white"
          >
            <option value="default">Recommended</option>
            <option value="trending">Most liked</option>
            <option value="new">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium bg-white"
          >
            <option value="">All conditions</option>
            <option value="new">New with tags</option>
            <option value="like_new">Like new</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <Package size={16} /> {listings.length} items
        </span>
        {favoriteIds.size > 0 && (
          <span className="text-hafi-purple font-semibold">{favoriteIds.size} saved ♥</span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {listings.map((item) => (
          <ListingCard
            key={item.id}
            item={item}
            isFavorite={favoriteIds.has(item.id)}
            onToggleFavorite={user ? toggleFavorite : undefined}
          />
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
