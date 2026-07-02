import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, ShoppingBag, Sparkles, Star, TrendingUp } from "lucide-react";
import { useApp } from "../../context/AppContext";
import ListingCard, { type ListingCardItem } from "../../components/ListingCard";
import BookingModal from "../../components/BookingModal";
import { formatPrice, trpcCall } from "../../lib/api";

type Category = { id: number; name: string; icon: string | null };
type ServiceRow = {
  service: { id: number; name: string; price: string; duration: number };
  provider: { businessName: string };
  category: Category | null;
};

export default function ClientHomePage() {
  const { user } = useApp();
  const [listings, setListings] = useState<ListingCardItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [wallet, setWallet] = useState({ balance: "0", loyaltyPoints: 0 });
  const [bookingService, setBookingService] = useState<{
    id: number;
    name: string;
    price: string;
    duration: number;
    providerName?: string;
  } | null>(null);

  useEffect(() => {
    trpcCall<ListingCardItem[]>("listings.list", { limit: 8 }).then(setListings).catch(() => {});
    trpcCall<Category[]>("discovery.categories").then(setCategories).catch(() => {});
    trpcCall<ServiceRow[]>("bookings.services").then(setServices).catch(() => {});
    trpcCall<{ balance: string; loyaltyPoints: number }>("wallet.balance").then(setWallet).catch(() => {});
  }, []);

  const popularServices = services.slice(0, 6);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-hafi-dark via-hafi-mid to-hafi-purple p-8 md:p-12 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-hafi-gold/10 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative max-w-2xl">
          <p className="text-purple-200 text-sm font-semibold">Welcome back, {user?.name?.split(" ")[0]}</p>
          <h1 className="text-3xl md:text-5xl font-black font-display mt-2 leading-tight">
            Book beauty. Shop local. ✨
          </h1>
          <p className="text-purple-200 mt-4 text-lg">
            Booksy-style appointments & Vinted-style marketplace — all in one place.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              to="/client/discover"
              className="inline-flex items-center gap-2 bg-white text-hafi-purple font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-shadow"
            >
              <Calendar size={18} /> Book a service
            </Link>
            <Link
              to="/client/marketplace"
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur text-white font-bold px-6 py-3 rounded-xl border border-white/20 hover:bg-white/25"
            >
              <ShoppingBag size={18} /> Browse marketplace
            </Link>
          </div>
        </div>
        <div className="relative flex gap-4 mt-8 md:absolute md:bottom-8 md:right-8 md:mt-0">
          <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-3 border border-white/10">
            <p className="text-xs text-purple-200">Loyalty</p>
            <p className="font-black text-xl text-hafi-gold">{wallet.loyaltyPoints} pts</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-3 border border-white/10">
            <p className="text-xs text-purple-200">Wallet</p>
            <p className="font-black text-xl">{formatPrice(wallet.balance)}</p>
          </div>
        </div>
      </section>

      {/* Categories — Booksy style */}
      {categories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black font-display">Browse by category</h2>
            <Link to="/client/discover" className="text-hafi-purple text-sm font-semibold flex items-center gap-1">
              See all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/client/discover?category=${encodeURIComponent(cat.name.toLowerCase())}`}
                className="flex-shrink-0 flex flex-col items-center gap-2 w-20 md:w-24 p-3 rounded-2xl bg-white border border-gray-100 hover:border-hafi-purple hover:shadow-md transition-all"
              >
                <span className="text-2xl md:text-3xl">{cat.icon ?? "✨"}</span>
                <span className="text-[11px] font-bold text-gray-700 text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular services */}
      {popularServices.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Sparkles className="text-hafi-purple" size={22} /> Popular services
            </h2>
            <Link to="/client/discover" className="text-hafi-purple text-sm font-semibold">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularServices.map(({ service, provider, category }) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl flex-shrink-0">
                  {category?.icon ?? "✨"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{service.name}</p>
                  <p className="text-sm text-gray-500 truncate">{provider.businessName}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="font-black text-hafi-purple">{formatPrice(service.price)}</p>
                      <p className="text-xs text-gray-400">{service.duration} min</p>
                    </div>
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
                      className="bg-hafi-purple text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-hafi-mid"
                    >
                      Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending marketplace — Vinted style */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <TrendingUp className="text-hafi-gold" size={22} /> Trending on marketplace
          </h2>
          <Link to="/client/marketplace" className="text-hafi-purple text-sm font-semibold">View all</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {listings.map((item) => (
            <ListingCard key={item.id} item={item} compact />
          ))}
        </div>
      </section>

      {/* Trust banner */}
      <section className="bg-gradient-to-r from-hafi-dark to-hafi-mid rounded-3xl p-8 md:p-10 text-white">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Star className="text-hafi-gold fill-hafi-gold" />
            <span className="font-bold">The Hafi Promise</span>
          </div>
          <p className="text-purple-200 mb-6">
            Verified providers, protected payments, reliable chat, and simple booking — inspired by the best of Booksy & Vinted.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              { icon: "🛡️", label: "Buyer protection" },
              { icon: "✓", label: "Verified merchants" },
              { icon: "📅", label: "Easy rebooking" },
            ].map(({ icon, label }) => (
              <div key={label} className="bg-white/10 rounded-xl px-4 py-3 font-semibold flex items-center gap-2">
                <span>{icon}</span> {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {bookingService && (
        <BookingModal service={bookingService} onClose={() => setBookingService(null)} />
      )}
    </div>
  );
}
