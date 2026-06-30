import { NavLink, Outlet } from "react-router-dom";
import {
  Calendar,
  Home,
  MessageCircle,
  Search,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react";
import { useApp } from "../context/AppContext";

const nav = [
  { to: "/client", icon: Home, label: "Home", end: true },
  { to: "/client/discover", icon: Search, label: "Discover" },
  { to: "/client/marketplace", icon: ShoppingBag, label: "Marketplace" },
  { to: "/client/bookings", icon: Calendar, label: "Bookings" },
  { to: "/client/messages", icon: MessageCircle, label: "Messages" },
  { to: "/client/ai", icon: Sparkles, label: "Hafi AI" },
  { to: "/client/profile", icon: User, label: "Profile" },
];

export default function ClientLayout() {
  const { user } = useApp();

  return (
    <div className="min-h-screen bg-hafi-bg">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-purple-100 z-40">
        <div className="p-6 border-b border-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-hafi-purple to-hafi-light flex items-center justify-center text-white font-black text-lg">
              H
            </div>
            <div>
              <p className="font-black font-display text-hafi-dark">Hafi</p>
              <p className="text-xs text-gray-400">Client</p>
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
                  isActive ? "bg-purple-50 text-hafi-purple" : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-purple-50 text-sm text-gray-500">
          {user?.name}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-purple-100 lg:hidden px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-hafi-purple text-white flex items-center justify-center font-black">H</div>
            <span className="font-black font-display">Hafi Client</span>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-purple-100 z-50 safe-area-pb">
        <div className="flex justify-around py-2 max-w-lg mx-auto">
          {nav.slice(0, 5).map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 ${isActive ? "text-hafi-purple" : "text-gray-400"}`
              }
            >
              <Icon size={22} />
              <span className="text-[10px] font-semibold">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
