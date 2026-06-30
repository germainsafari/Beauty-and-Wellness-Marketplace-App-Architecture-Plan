import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, DollarSign, Package, Tag, TrendingUp } from "lucide-react";
import { formatPrice, trpcCall } from "../../lib/api";

export default function MerchantDashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    trpcCall("merchant.dashboard").then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="py-20 text-center text-gray-400">Loading dashboard...</div>;

  const stats = [
    { label: "Today's appointments", value: data.todayAppointments, icon: Calendar, color: "text-blue-600 bg-blue-50" },
    { label: "Week revenue", value: formatPrice(data.weekRevenue), icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
    { label: "Active listings", value: data.activeListings, icon: Package, color: "text-purple-600 bg-purple-50" },
    { label: "Pending offers", value: data.pendingOffers, icon: Tag, color: "text-amber-600 bg-amber-50" },
  ];

  const quickActions = [
    { label: "View calendar", to: "/merchant/calendar" },
    { label: "Manage services", to: "/merchant/services" },
    { label: "New listing", to: "/merchant/listings/new" },
    { label: "View offers", to: "/merchant/offers" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black font-display text-hafi-dark">Dashboard</h1>
        <p className="text-gray-500">{data.profile.businessName} · Booksy Biz style</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-black">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <h2 className="font-bold flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-hafi-gold" /> Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="text-left p-4 rounded-xl bg-slate-50 hover:bg-purple-50 text-sm font-semibold transition-colors"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="bg-gradient-to-br from-hafi-dark to-hafi-mid rounded-2xl p-6 text-white">
          <p className="text-purple-200 text-sm">Rating</p>
          <p className="text-4xl font-black mt-1">⭐ {data.profile.rating}</p>
          <p className="text-purple-200 text-sm mt-2">{data.profile.reviewCount} reviews</p>
          <p className="text-sm text-purple-100 mt-6 leading-relaxed">
            {data.profile.description || "Update your business profile to attract more clients."}
          </p>
          <Link to="/merchant/profile" className="inline-block mt-4 text-sm font-bold text-hafi-gold hover:underline">
            Edit profile →
          </Link>
        </div>
      </div>
    </div>
  );
}
