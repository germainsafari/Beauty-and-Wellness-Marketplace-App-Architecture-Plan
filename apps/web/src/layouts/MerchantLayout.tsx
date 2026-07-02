import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  BriefcaseBusiness,
  Calendar,
  LayoutDashboard,
  MessageCircle,
  Package,
  Tag,
  User,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import NotificationBell from "../components/NotificationBell";

const nav = [
  { to: "/merchant", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/merchant/calendar", icon: Calendar, label: "Calendar" },
  { to: "/merchant/services", icon: BriefcaseBusiness, label: "Services" },
  { to: "/merchant/listings", icon: Package, label: "Listings" },
  { to: "/merchant/offers", icon: Tag, label: "Offers" },
  { to: "/merchant/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/merchant/messages", icon: MessageCircle, label: "Messages" },
  { to: "/merchant/profile", icon: User, label: "Profile" },
];

export default function MerchantLayout() {
  const { user } = useApp();

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-hafi-dark text-white z-40">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-hafi-gold flex items-center justify-center text-hafi-dark font-black">
              H
            </div>
            <div>
              <p className="font-black font-display">Hafi Biz</p>
              <p className="text-xs text-purple-300">Merchant</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive ? "bg-white/15 text-white" : "text-purple-200 hover:bg-white/10"
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 text-sm text-purple-300 flex items-center justify-between gap-3">
          <span className="truncate">{user?.name}</span>
          <NotificationBell />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-hafi-dark text-white lg:hidden px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-hafi-gold text-hafi-dark flex items-center justify-center font-black">H</div>
            <span className="font-black font-display">Hafi Merchant</span>
          </div>
          <NotificationBell />
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-hafi-dark border-t border-white/10 z-50">
        <div className="flex justify-around py-2">
          {nav.slice(0, 5).map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 ${isActive ? "text-hafi-gold" : "text-purple-300"}`
              }
            >
              <Icon size={20} />
              <span className="text-[10px] font-semibold">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
