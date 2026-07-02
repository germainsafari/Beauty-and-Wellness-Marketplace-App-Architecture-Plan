import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  CreditCard,
  HelpCircle,
  Package,
  Shield,
  Sparkles,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { DEMO_DOC_URLS } from "../../lib/onboarding";
import { formatPrice, trpcCall } from "../../lib/api";

type Section = "verification" | "loyalty" | "payments" | "notifications" | "orders" | "help";

const PAYMENT_OPTIONS = [
  { id: "demo", label: "Demo instant pay", desc: "MVP testing — instant success" },
  { id: "mtn_momo", label: "MTN MoMo", desc: "Mobile money request to your phone" },
  { id: "airtel_money", label: "Airtel Money", desc: "Airtel mobile money" },
  { id: "stripe", label: "Card (Stripe)", desc: "Visa / Mastercard" },
] as const;

export default function ClientProfilePage() {
  const { user, logout, switchRole } = useApp();
  const [open, setOpen] = useState<Section | null>("loyalty");
  const [docUrl, setDocUrl] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [wallet, setWallet] = useState({ balance: "0", loyaltyPoints: 0 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [helpTopics, setHelpTopics] = useState<any[]>([]);
  const [defaultPayment, setDefaultPayment] = useState("demo");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    trpcCall<any[]>("verification.mine").then(setRequests).catch(() => {});
    trpcCall<any[]>("profile.loyaltyActivity").then(setLedger).catch(() => {});
    trpcCall<{ balance: string; loyaltyPoints: number }>("wallet.balance").then(setWallet).catch(() => {});
    trpcCall<any[]>("notifications.mine").then(setNotifications).catch(() => {});
    trpcCall<any[]>("profile.purchaseHistory").then(setOrders).catch(() => {});
    trpcCall<any[]>("profile.paymentHistory").then(setPayments).catch(() => {});
    trpcCall<any[]>("help.topics").then(setHelpTopics).catch(() => {});
    trpcCall<{ defaultPaymentProvider: string }>("profile.summary")
      .then((s) => setDefaultPayment(s.defaultPaymentProvider))
      .catch(() => {});
  };

  useEffect(load, []);

  const toggle = (s: Section) => setOpen((cur) => (cur === s ? null : s));

  const submitVerification = async () => {
    setError("");
    try {
      new URL(docUrl);
    } catch {
      setError("Enter a valid HTTPS document URL.");
      return;
    }
    await trpcCall("verification.submit", { documentUrl: docUrl, documentType: "national_id" }, "mutation");
    setDocUrl("");
    setMessage("Verification submitted — admin will review within 24–48 hours.");
    load();
  };

  const savePayment = async (provider: string) => {
    await trpcCall("profile.setDefaultPayment", { provider }, "mutation");
    setDefaultPayment(provider);
    setMessage(`Default payment set to ${provider.replace("_", " ")}.`);
  };

  const markAllRead = async () => {
    await trpcCall("notifications.markAllRead", {}, "mutation");
    load();
    setMessage("All notifications marked as read.");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-black font-display">Profile</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-50">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-hafi-purple to-hafi-light text-white flex items-center justify-center text-2xl font-black">
            {user?.name?.[0]}
          </div>
          <div>
            <p className="font-bold text-xl">{user?.name}</p>
            <p className="text-gray-500">{user?.phone}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs bg-purple-100 text-hafi-purple px-2 py-0.5 rounded-full font-semibold">Client</span>
              {user?.isVerified && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Verified</span>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-hafi-bg rounded-xl p-3">
            <p className="text-xs text-gray-400">Wallet</p>
            <p className="font-black text-hafi-purple">{formatPrice(wallet.balance)}</p>
          </div>
          <div className="bg-hafi-bg rounded-xl p-3">
            <p className="text-xs text-gray-400">Loyalty points</p>
            <p className="font-black text-hafi-dark">{wallet.loyaltyPoints} pts</p>
          </div>
        </div>
      </div>

      {message && <p className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">{message}</p>}
      {error && <p className="text-sm font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

      {/* Verification */}
      <ProfileSection
        icon={<Shield size={18} />}
        title="Identity verification"
        open={open === "verification"}
        onToggle={() => toggle("verification")}
      >
        <p className="text-xs text-gray-500 mb-3">Upload a secure document URL for the MVP demo (HTTPS required).</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {DEMO_DOC_URLS.map((d) => (
            <button
              key={d.url}
              type="button"
              onClick={() => setDocUrl(d.url)}
              className="text-xs bg-purple-50 text-hafi-purple font-semibold px-3 py-1.5 rounded-full hover:bg-purple-100"
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
            placeholder="https://your-secure-document-url..."
            className="flex-1 border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hafi-purple"
          />
          <button
            onClick={submitVerification}
            disabled={!docUrl.startsWith("https://")}
            className="bg-hafi-purple text-white rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            Submit
          </button>
        </div>
        {requests[0] && (
          <p className="text-xs mt-3 capitalize">
            Latest status: <strong className="text-hafi-purple">{requests[0].status}</strong>
            {requests[0].documentUrl && (
              <span className="text-gray-400 block truncate mt-1">Doc: {requests[0].documentUrl}</span>
            )}
          </p>
        )}
      </ProfileSection>

      {/* Loyalty */}
      <ProfileSection
        icon={<Sparkles size={18} />}
        title="Recent loyalty activity"
        open={open === "loyalty"}
        onToggle={() => toggle("loyalty")}
        badge={`${wallet.loyaltyPoints} pts total`}
      >
        {ledger.length === 0 ? (
          <p className="text-sm text-gray-400">No ledger entries yet — earn points when you shop, book, or get verified.</p>
        ) : (
          ledger.slice(0, 8).map((entry) => (
            <div key={entry.id} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
              <span className="capitalize text-gray-700">{entry.reason.replaceAll("_", " ")}</span>
              <span className={`font-bold ${entry.points >= 0 ? "text-hafi-purple" : "text-red-500"}`}>
                {entry.points >= 0 ? "+" : ""}
                {entry.points}
              </span>
            </div>
          ))
        )}
      </ProfileSection>

      {/* Payments */}
      <ProfileSection
        icon={<CreditCard size={18} />}
        title="Payment methods"
        open={open === "payments"}
        onToggle={() => toggle("payments")}
      >
        <div className="space-y-2">
          {PAYMENT_OPTIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => savePayment(p.id)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                defaultPayment === p.id ? "border-hafi-purple bg-purple-50" : "border-gray-100 hover:border-purple-200"
              }`}
            >
              <p className="font-bold text-sm">{p.label}</p>
              <p className="text-xs text-gray-500">{p.desc}</p>
            </button>
          ))}
        </div>
        {payments.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold text-gray-500 mb-2">Recent payments</p>
            {payments.slice(0, 5).map((p) => (
              <div key={p.id} className="flex justify-between text-xs py-1.5">
                <span className="capitalize">{p.purpose} · {p.provider.replace("_", " ")}</span>
                <span className="font-semibold">{formatPrice(p.amount)} · {p.status}</span>
              </div>
            ))}
          </div>
        )}
      </ProfileSection>

      {/* Notifications */}
      <ProfileSection
        icon={<Bell size={18} />}
        title="Notifications"
        open={open === "notifications"}
        onToggle={() => toggle("notifications")}
        badge={notifications.filter((n) => !n.isRead).length ? `${notifications.filter((n) => !n.isRead).length} new` : undefined}
      >
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400">No notifications yet.</p>
        ) : (
          <>
            <button onClick={markAllRead} className="text-xs font-bold text-hafi-purple mb-3 hover:underline">
              Mark all as read
            </button>
            {notifications.slice(0, 8).map((n) => (
              <div key={n.id} className={`py-2 border-b border-gray-50 ${!n.isRead ? "bg-purple-50/50 -mx-2 px-2 rounded-lg" : ""}`}>
                <p className="text-sm font-semibold">{n.title}</p>
                {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
              </div>
            ))}
          </>
        )}
      </ProfileSection>

      {/* Purchase history */}
      <ProfileSection
        icon={<Package size={18} />}
        title="Purchase history"
        open={open === "orders"}
        onToggle={() => toggle("orders")}
        badge={orders.length ? `${orders.length}` : undefined}
      >
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400">No purchases yet. <Link to="/client/marketplace" className="text-hafi-purple font-semibold">Browse marketplace</Link></p>
        ) : (
          orders.slice(0, 10).map(({ order, listing }) => (
            <Link
              key={order.id}
              to={`/client/marketplace/${listing.id}`}
              className="flex justify-between items-center py-2 border-b border-gray-50 hover:bg-purple-50/30 -mx-2 px-2 rounded-lg"
            >
              <div>
                <p className="text-sm font-semibold truncate max-w-[200px]">{listing.title}</p>
                <p className="text-xs text-gray-400 capitalize">{order.status.replace("_", " ")}</p>
              </div>
              <span className="font-bold text-hafi-purple text-sm">{formatPrice(order.totalAmount)}</span>
            </Link>
          ))
        )}
      </ProfileSection>

      {/* Help */}
      <ProfileSection
        icon={<HelpCircle size={18} />}
        title="Help & support"
        open={open === "help"}
        onToggle={() => toggle("help")}
      >
        <div className="space-y-3">
          {(helpTopics.length ? helpTopics : []).map((t: any) => (
            <details key={t.id} className="group">
              <summary className="text-sm font-semibold cursor-pointer list-none flex justify-between items-center py-1">
                {t.title}
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform text-gray-400" />
              </summary>
              <p className="text-xs text-gray-500 mt-2 pl-1 leading-relaxed">{t.body}</p>
            </details>
          ))}
        </div>
        <a href="mailto:support@hafi.rw" className="inline-block mt-4 text-sm font-bold text-hafi-purple hover:underline">
          Email support@hafi.rw →
        </a>
      </ProfileSection>

      <button onClick={() => switchRole("provider")} className="w-full bg-hafi-dark text-white font-bold py-4 rounded-xl">
        Switch to Merchant mode
      </button>
      <button onClick={logout} className="w-full border border-red-200 text-red-500 font-bold py-4 rounded-xl">
        Log out
      </button>
    </div>
  );
}

function ProfileSection({
  icon,
  title,
  open,
  onToggle,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50">
        <span className="text-hafi-purple">{icon}</span>
        <span className="font-bold flex-1">{title}</span>
        {badge && <span className="text-xs font-bold bg-purple-100 text-hafi-purple px-2 py-0.5 rounded-full">{badge}</span>}
        {open ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-gray-50 pt-3">{children}</div>}
    </div>
  );
}
