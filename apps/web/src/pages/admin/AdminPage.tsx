import { useEffect, useState } from "react";
import { formatPrice, trpcCall } from "../../lib/api";
import { useApp } from "../../context/AppContext";
import VerificationTab from "./VerificationTab";
import UsersTab from "./UsersTab";
import ListingsTab from "./ListingsTab";
import BookingsTab from "./BookingsTab";
import OrdersTab from "./OrdersTab";
import AuditLogTab from "./AuditLogTab";

type Summary = {
  users: number;
  listings: number;
  bookings: number;
  revenue: string;
  pendingVerification: number;
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "verification", label: "Verification" },
  { id: "users", label: "Users" },
  { id: "listings", label: "Listings" },
  { id: "bookings", label: "Bookings" },
  { id: "orders", label: "Orders" },
  { id: "audit", label: "Audit log" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminPage() {
  const { user, logout } = useApp();
  const [tab, setTab] = useState<TabId>("overview");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState("");

  const loadSummary = () => {
    trpcCall<Summary>("admin.summary").then(setSummary).catch(() => {});
  };

  useEffect(loadSummary, []);

  const notify = (text: string) => {
    setMessage(text);
    loadSummary();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-hafi-dark text-white px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-purple-200 text-sm">Hafi Admin</p>
            <h1 className="text-2xl font-black">Operations Console</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-purple-100 hidden sm:inline">{user?.name}</span>
            <button onClick={logout} className="border border-white/20 rounded-xl px-4 py-2 text-sm font-bold">
              Log out
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1 py-2 min-w-max">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setMessage("");
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                  tab === t.id ? "bg-hafi-purple text-white shadow" : "text-gray-500 hover:bg-purple-50"
                }`}
              >
                {t.label}
                {t.id === "verification" && (summary?.pendingVerification ?? 0) > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-amber-400 text-hafi-dark text-[11px]">
                    {summary?.pendingVerification}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {message && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-3 text-sm font-semibold">
            {message}
          </div>
        )}

        {tab === "overview" && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              ["Users", summary?.users ?? 0],
              ["Listings", summary?.listings ?? 0],
              ["Bookings", summary?.bookings ?? 0],
              ["Revenue", formatPrice(summary?.revenue ?? "0")],
              ["Pending IDs", summary?.pendingVerification ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="bg-white rounded-xl p-5 border shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-400 font-bold">{label}</p>
                <p className="text-2xl font-black mt-2">{value}</p>
              </div>
            ))}
          </section>
        )}

        {tab === "verification" && <VerificationTab onChanged={notify} />}
        {tab === "users" && <UsersTab onChanged={notify} />}
        {tab === "listings" && <ListingsTab onChanged={notify} />}
        {tab === "bookings" && <BookingsTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "audit" && <AuditLogTab />}
      </main>
    </div>
  );
}
