import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import {
  Calendar, ChevronRight, Gift, Heart, Loader2, MapPin,
  Plus, ShoppingBag, Sparkles, Star, Tag, TrendingUp, Zap
} from "lucide-react";
import { Link } from "wouter";

const CATEGORY_PILLS = [
  { label: "Hair", emoji: "💇‍♀️" },
  { label: "Skincare", emoji: "✨" },
  { label: "Makeup", emoji: "💄" },
  { label: "Nails", emoji: "💅" },
  { label: "Massage", emoji: "💆" },
  { label: "Lashes", emoji: "👁️" },
  { label: "Tools", emoji: "🔧" },
];

function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1A0533] via-[#2D0A5C] to-[#4A1A8C] px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#9B6FE8] to-[#6C3FC5] flex items-center justify-center mb-6 shadow-2xl shadow-purple-900">
        <span className="text-4xl font-black text-white">H</span>
      </div>
      <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Welcome to Hafi</h1>
      <p className="text-lg font-semibold text-purple-200 mb-2">Beauty &amp; Wellness Marketplace</p>
      <p className="text-sm text-purple-300 mb-10 max-w-xs leading-relaxed">
        Book beauty services, shop pre-loved products, and connect with top beauty professionals in Rwanda.
      </p>
      <a href={getLoginUrl()} className="w-full max-w-xs">
        <button className="w-full bg-gradient-to-r from-[#F5A623] to-[#F7C05A] text-white font-black py-4 rounded-2xl text-lg shadow-xl shadow-amber-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
          Get Started
        </button>
      </a>
      <p className="text-purple-400 text-xs mt-4">Free to join · No credit card required</p>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();

  const { data: featuredListings, isLoading: loadingListings } = trpc.listings.list.useQuery(
    { limit: 6 },
    { enabled: isAuthenticated }
  );
  const { data: myBookings, isLoading: loadingBookings } = trpc.bookings.mine.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: walletData } = trpc.wallet.balance.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F5FF]">
        <Loader2 className="w-8 h-8 text-[#6C3FC5] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SplashScreen />;
  }

  const upcomingBooking = myBookings?.[0];
  const loyaltyPoints = Math.floor(Number(walletData?.balance || 0) / 100);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-4 pb-8">
        {/* Greeting */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-gray-400 font-medium">Good day 👋</p>
            <h1 className="text-2xl font-black text-[#1A0533]">{user?.name?.split(" ")[0] || "Beauty Lover"}</h1>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#6C3FC5] to-[#9B6FE8] flex items-center justify-center shadow-md shadow-purple-200">
            <span className="text-white font-black text-lg">{(user?.name?.[0] || "H").toUpperCase()}</span>
          </div>
        </div>

        {/* Loyalty Points Banner */}
        <div className="bg-gradient-to-r from-[#6C3FC5] to-[#9B6FE8] rounded-2xl p-4 mb-5 flex items-center gap-4 shadow-lg shadow-purple-200">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-purple-200 text-xs font-medium">Hafi Loyalty Points</p>
            <p className="text-white font-black text-xl">{loyaltyPoints.toLocaleString()} pts</p>
            <p className="text-purple-200 text-xs">Earn points on every booking &amp; purchase</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs">Wallet</p>
            <p className="text-white font-bold text-sm">RWF {Number(walletData?.balance || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Book", icon: Calendar, href: "/bookings", color: "bg-purple-100 text-[#6C3FC5]" },
            { label: "Shop", icon: ShoppingBag, href: "/marketplace", color: "bg-amber-100 text-amber-600" },
            { label: "Sell", icon: Tag, href: "/create-listing", color: "bg-emerald-100 text-emerald-600" },
            { label: "Offers", icon: Zap, href: "/seller-hub", color: "bg-pink-100 text-pink-600" },
          ].map((action) => (
            <Link key={action.label} href={action.href}>
              <div className="flex flex-col items-center gap-1.5 bg-white rounded-2xl p-3 shadow-sm border border-gray-50 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-[#1A0533]">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Upcoming Booking */}
        {loadingBookings ? (
          <div className="bg-white rounded-2xl p-4 mb-5 animate-pulse h-24 shadow-sm" />
        ) : upcomingBooking ? (
          <div className="bg-white rounded-2xl p-4 mb-5 shadow-sm border border-gray-50">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-[#1A0533] text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#6C3FC5]" /> Upcoming Appointment
              </p>
              <Link href="/bookings">
                <span className="text-xs text-[#6C3FC5] font-semibold flex items-center gap-0.5">
                  View all <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-[#6C3FC5]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#1A0533] text-sm">{(upcomingBooking as any).serviceName || "Beauty Service"}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date((upcomingBooking as any).scheduledAt).toLocaleDateString("en-RW", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">Confirmed</span>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-5 border border-purple-100 flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Calendar className="w-6 h-6 text-[#6C3FC5]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#1A0533] text-sm">No upcoming bookings</p>
              <p className="text-xs text-gray-400">Discover beauty services near you</p>
            </div>
            <Link href="/bookings">
              <button className="bg-[#6C3FC5] text-white text-xs font-bold px-3 py-2 rounded-xl">Book Now</button>
            </Link>
          </div>
        )}

        {/* Categories */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-[#1A0533] text-base">Browse Categories</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_PILLS.map((cat) => (
              <Link key={cat.label} href={`/marketplace?category=${cat.label.toLowerCase()}`}>
                <div className="flex-shrink-0 flex flex-col items-center gap-1 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-50 hover:border-purple-200 hover:shadow-purple-100 transition-all cursor-pointer">
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-xs font-semibold text-[#1A0533] whitespace-nowrap">{cat.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Marketplace Items */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-[#1A0533] text-base flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#F5A623]" /> Trending Now
            </h2>
            <Link href="/marketplace">
              <span className="text-xs text-[#6C3FC5] font-semibold flex items-center gap-0.5">
                See all <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>

          {loadingListings ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl animate-pulse h-48 shadow-sm" />
              ))}
            </div>
          ) : featuredListings && featuredListings.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {featuredListings.slice(0, 6).map((item: any) => (
                <Link key={item.id} href={`/marketplace/listing/${item.id}`}>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                    <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 relative">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
                      )}
                      <div className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                        <Heart className="w-3.5 h-3.5 text-gray-300" />
                      </div>
                      {item.condition === "new" && (
                        <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">NEW</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-[#1A0533] truncate">{item.title}</p>
                      <p className="text-sm font-black text-[#6C3FC5] mt-0.5">RWF {Number(item.price).toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-300" />
                        <span className="text-[10px] text-gray-400 truncate">{item.location || "Rwanda"}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-purple-200">
              <ShoppingBag className="w-10 h-10 text-purple-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-600 text-sm">No listings yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to list a beauty product!</p>
              <Link href="/create-listing">
                <button className="mt-4 flex items-center gap-1.5 mx-auto bg-gradient-to-r from-[#6C3FC5] to-[#9B6FE8] text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md shadow-purple-200">
                  <Plus className="w-4 h-4" /> List Something
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Hafi Promise */}
        <div className="bg-gradient-to-br from-[#1A0533] to-[#2D0A5C] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-[#F5A623]" />
            <h3 className="font-black text-base">The Hafi Promise</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "🔒", label: "Secure Payments", sub: "Escrow protected" },
              { icon: "✅", label: "Verified Sellers", sub: "ID checked" },
              { icon: "🔄", label: "Easy Returns", sub: "48h protection" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl mb-1">{item.icon}</div>
                <p className="text-white text-xs font-semibold leading-tight">{item.label}</p>
                <p className="text-purple-300 text-[10px] mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
