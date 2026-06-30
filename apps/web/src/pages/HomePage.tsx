import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Gift, MapPin, Plus, ShoppingBag, Sparkles, Tag, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatPrice, trpcCall } from "../lib/api";

type Listing = { id: number; title: string; price: string; condition: string; images: string[]; location: string | null; isBumped: boolean };

export default function HomePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [wallet, setWallet] = useState({ balance: "0", loyaltyPoints: 0 });

  useEffect(() => {
    trpcCall<Listing[]>("listings.list", { limit: 6 }).then(setListings).catch(() => {});
    trpcCall<{ balance: string; loyaltyPoints: number }>("wallet.balance").then(setWallet).catch(() => {});
  }, []);

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-gray-400 font-medium">Good day 👋</p>
          <h1 className="text-2xl font-black font-display">{user?.name?.split(" ")[0] || "Beauty Lover"}</h1>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-hafi-purple to-hafi-light flex items-center justify-center text-white font-black text-lg">
          {(user?.name?.[0] || "H").toUpperCase()}
        </div>
      </div>

      <div className="bg-gradient-to-r from-hafi-purple to-hafi-light rounded-2xl p-4 mb-5 flex items-center gap-4 shadow-lg shadow-purple-200">
        <Gift className="w-8 h-8 text-white flex-shrink-0" />
        <div className="flex-1">
          <p className="text-purple-200 text-xs">Hafi Loyalty Points</p>
          <p className="text-white font-black text-xl">{wallet.loyaltyPoints.toLocaleString()} pts</p>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-xs">Wallet</p>
          <p className="text-white font-bold text-sm">{formatPrice(wallet.balance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Book", icon: Calendar, href: "/bookings", color: "bg-purple-100 text-hafi-purple" },
          { label: "Shop", icon: ShoppingBag, href: "/marketplace", color: "bg-amber-100 text-amber-600" },
          { label: "Sell", icon: Tag, href: "/sell", color: "bg-emerald-100 text-emerald-600" },
          { label: "AI", icon: Zap, href: "/ai", color: "bg-pink-100 text-pink-600" },
        ].map((a) => (
          <Link key={a.label} to={a.href} className="flex flex-col items-center gap-1.5 bg-white rounded-2xl p-3 shadow-sm border border-gray-50 hover:scale-[1.03] transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
              <a.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold">{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-black flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-hafi-gold" /> Trending Now
        </h2>
        <Link to="/marketplace" className="text-xs text-hafi-purple font-semibold">See all →</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {listings.map((item) => (
          <Link key={item.id} to={`/marketplace/${item.id}`} className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden hover:scale-[1.02] transition-all">
            <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 relative">
              {item.images?.[0] ? (
                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
              )}
              {item.isBumped && <span className="absolute top-2 left-2 bg-hafi-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full">HOT</span>}
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold truncate">{item.title}</p>
              <p className="text-sm font-black text-hafi-purple">{formatPrice(item.price)}</p>
              <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-1"><MapPin className="w-3 h-3" />{item.location || "Rwanda"}</p>
            </div>
          </Link>
        ))}
      </div>

      {listings.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-purple-200 mb-6">
          <ShoppingBag className="w-10 h-10 text-purple-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-600 text-sm">No listings yet</p>
          <Link to="/sell" className="mt-4 inline-flex items-center gap-1.5 bg-gradient-to-r from-hafi-purple to-hafi-light text-white font-bold px-5 py-2.5 rounded-xl text-sm">
            <Plus className="w-4 h-4" /> List Something
          </Link>
        </div>
      )}

      <div className="bg-gradient-to-br from-hafi-dark to-hafi-mid rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-hafi-gold" />
          <h3 className="font-black">The Hafi Promise</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          {[["🔒", "Secure Payments"], ["✅", "Verified Sellers"], ["🔄", "Easy Returns"]].map(([icon, label]) => (
            <div key={label}>
              <div className="text-2xl mb-1">{icon}</div>
              <p className="font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
