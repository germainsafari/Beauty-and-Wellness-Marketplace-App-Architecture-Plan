import { NavLink, Outlet } from "react-router-dom";
import { Calendar, Home, ShoppingBag, Sparkles, User } from "lucide-react";

const tabs = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/marketplace", icon: ShoppingBag, label: "Market" },
  { to: "/bookings", icon: Calendar, label: "Bookings" },
  { to: "/ai", icon: Sparkles, label: "Hafi AI" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-hafi-bg shadow-xl">
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-purple-100 z-50">
        <div className="flex justify-around py-2">
          {tabs.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive ? "text-hafi-purple bg-purple-50" : "text-gray-400"
                }`
              }
            >
              <Icon size={22} strokeWidth={2} />
              <span className="text-[10px] font-semibold">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
