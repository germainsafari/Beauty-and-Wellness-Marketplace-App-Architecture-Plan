import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Star, TrendingUp } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { formatPrice, trpcCall } from "../../lib/api";

type Listing = { id: number; title: string; price: string; images: string[]; location: string | null };

export default function ClientHomePage() {
  const { user } = useApp();
  const [listings, setListings] = useState<Listing[]>([]);
  const [wallet, setWallet] = useState({ balance: "0", loyaltyPoints: 0 });

  useEffect(() => {
    trpcCall<Listing[]>("listings.list", { limit: 8 }).then(setListings).catch(() => {});
    trpcCall<{ balance: string; loyaltyPoints: number }>("wallet.balance").then(setWallet).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-gray-500">Welcome back</p>
          <h1 className="text-3xl md:text-4xl font-black font-display text-hafi-dark">
            Hey, {user?.name?.split(" ")[0]} ✨
          </h1>
        </div>
        <div className="flex gap-4">
          <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-purple-50">
            <p className="text-xs text-gray-400">Loyalty</p>
            <p className="font-black text-hafi-purple">{wallet.loyaltyPoints} pts</p>
          </div>
          <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-purple-50">
            <p className="text-xs text-gray-400">Wallet</p>
            <p className="font-black text-hafi-dark">{formatPrice(wallet.balance)}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Discover salons", desc: "Booksy-style booking", href: "/client/discover", color: "from-purple-500 to-violet-600" },
          { title: "Marketplace", desc: "Vinted-style shop", href: "/client/marketplace", color: "from-amber-500 to-orange-500" },
          { title: "My bookings", desc: "Upcoming visits", href: "/client/bookings", color: "from-emerald-500 to-teal-600" },
          { title: "Hafi AI", desc: "Beauty concierge", href: "/client/ai", color: "from-pink-500 to-rose-500" },
        ].map((card) => (
          <Link
            key={card.href}
            to={card.href}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white hover:scale-[1.02] transition-transform shadow-lg`}
          >
            <p className="font-black text-lg">{card.title}</p>
            <p className="text-white/80 text-sm mt-1">{card.desc}</p>
            <ArrowRight className="w-5 h-5 mt-4" />
          </Link>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <TrendingUp className="text-hafi-gold" size={22} /> Trending on Marketplace
          </h2>
          <Link to="/client/marketplace" className="text-hafi-purple text-sm font-semibold">View all</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
          {listings.map((item) => (
            <Link key={item.id} to={`/client/marketplace/${item.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-square bg-purple-50 overflow-hidden">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">💄</div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold truncate">{item.title}</p>
                <p className="text-hafi-purple font-black">{formatPrice(item.price)}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><MapPin size={12} />{item.location || "Rwanda"}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-hafi-dark to-hafi-mid rounded-3xl p-8 md:p-12 text-white">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Star className="text-hafi-gold" />
            <span className="font-bold">The Hafi Promise</span>
          </div>
          <p className="text-purple-200 mb-6">Escrow-protected marketplace purchases. Verified merchants. Easy booking cancellation.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {["Secure payments", "Verified sellers", "48h buyer protection"].map((t) => (
              <div key={t} className="bg-white/10 rounded-xl px-4 py-3 font-semibold">{t}</div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
