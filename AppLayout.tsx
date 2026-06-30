import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  Bookmark,
  ChevronRight,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Plus,
  Settings,
  ShoppingBag,
  Star,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
  { path: "/bookings", icon: Star, label: "Bookings" },
  { path: "/chat", icon: MessageCircle, label: "Messages" },
  { path: "/notifications", icon: Bell, label: "Alerts" },
];

const SIDEBAR_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
  { path: "/bookings", icon: Star, label: "Bookings" },
  { path: "/orders", icon: Package, label: "Orders" },
  { path: "/chat", icon: MessageCircle, label: "Messages" },
  { path: "/notifications", icon: Bell, label: "Alerts" },
  { path: "/favorites", icon: Bookmark, label: "Saved" },
  { path: "/seller-hub", icon: LayoutGrid, label: "Seller Hub" },
  { path: "/wallet", icon: Wallet, label: "Wallet" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function AppLayout({ children, hideNav }: { children: React.ReactNode; hideNav?: boolean }) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: notifData } = trpc.notifications.mine.useQuery(undefined, { enabled: isAuthenticated });
  const unreadCount = notifData?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="min-h-screen bg-[#FAF8FF] flex">
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-purple-100 fixed top-0 left-0 h-full z-30 shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-purple-50">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6C3FC5] to-[#9B6FE8] flex items-center justify-center shadow-lg shadow-purple-200">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div>
                <p className="font-bold text-[#1A0533] text-lg leading-none">Hafi</p>
                <p className="text-xs text-purple-400 mt-0.5">Beauty Marketplace</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 group ${
                      isActive
                        ? "bg-gradient-to-r from-[#6C3FC5] to-[#9B6FE8] text-white shadow-md shadow-purple-200"
                        : "text-gray-600 hover:bg-purple-50 hover:text-[#6C3FC5]"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400 group-hover:text-[#6C3FC5]"}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.path === "/notifications" && unreadCount > 0 && (
                      <span className="ml-auto bg-[#F5A623] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Create listing CTA */}
          <div className="mt-6">
            <Link href="/create-listing">
              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#F5A623] to-[#F7C05A] text-white font-semibold py-3 rounded-xl shadow-md shadow-amber-200 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="w-4 h-4" />
                Sell an Item
              </button>
            </Link>
          </div>
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-purple-50">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6C3FC5] to-[#9B6FE8] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A0533] truncate">{user.name || "User"}</p>
                <p className="text-xs text-gray-400 truncate">{user.email || ""}</p>
              </div>
              <button onClick={() => logout()} className="text-gray-400 hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <a href={getLoginUrl()}>
              <button className="w-full bg-[#6C3FC5] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#5A32A3] transition-colors">
                Sign In
              </button>
            </a>
          )}
        </div>
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ──────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-5 border-b border-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6C3FC5] to-[#9B6FE8] flex items-center justify-center">
                  <span className="text-white font-bold">H</span>
                </div>
                <span className="font-bold text-[#1A0533] text-lg">Hafi</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                        isActive ? "bg-[#6C3FC5] text-white" : "text-gray-600 hover:bg-purple-50"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.label}</span>
                      {item.path === "/notifications" && unreadCount > 0 && (
                        <span className="ml-auto bg-[#F5A623] text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-purple-50">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6C3FC5] to-[#9B6FE8] flex items-center justify-center text-white font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A0533] truncate">{user?.name || "User"}</p>
                  </div>
                  <button onClick={() => logout()} className="text-gray-400 hover:text-red-500">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <a href={getLoginUrl()}>
                  <button className="w-full bg-[#6C3FC5] text-white py-2.5 rounded-xl font-semibold text-sm">Sign In</button>
                </a>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-purple-100 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-[#6C3FC5] transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6C3FC5] to-[#9B6FE8] flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-[#1A0533]">Hafi</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/create-listing">
              <button className="bg-[#F5A623] text-white p-1.5 rounded-lg">
                <Plus className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/notifications">
              <button className="relative text-gray-600">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>

        {/* ── MOBILE BOTTOM NAV ─────────────────────────────────────── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-purple-100 px-2 py-1 safe-area-inset-bottom">
          <div className="flex items-center justify-around">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-150 ${
                      isActive ? "text-[#6C3FC5]" : "text-gray-400"
                    }`}
                  >
                    <div className="relative">
                      <item.icon className={`w-6 h-6 ${isActive ? "text-[#6C3FC5]" : "text-gray-400"}`} />
                      {item.path === "/notifications" && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-medium ${isActive ? "text-[#6C3FC5]" : "text-gray-400"}`}>
                      {item.label}
                    </span>
                    {isActive && <div className="w-1 h-1 rounded-full bg-[#6C3FC5]" />}
                  </button>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
