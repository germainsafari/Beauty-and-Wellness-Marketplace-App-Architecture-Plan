import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatPrice, trpcCall } from "../lib/api";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [wallet, setWallet] = useState({ balance: "0", loyaltyPoints: 0 });

  useEffect(() => {
    trpcCall<{ balance: string; loyaltyPoints: number }>("wallet.balance").then(setWallet).catch(() => {});
  }, []);

  return (
    <div>
      <div className="bg-gradient-to-r from-hafi-purple to-hafi-light text-white p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-white/25 flex items-center justify-center text-3xl font-black mx-auto mb-3">{(user?.name?.[0] || "H").toUpperCase()}</div>
        <h1 className="text-xl font-black font-display">{user?.name}</h1>
        <p className="text-purple-200 text-sm">{user?.phone}</p>
      </div>

      <div className="flex bg-white mx-4 -mt-4 rounded-2xl shadow-sm p-4 mb-4">
        <div className="flex-1 text-center"><p className="font-black text-lg">{wallet.loyaltyPoints}</p><p className="text-xs text-gray-400">Points</p></div>
        <div className="w-px bg-purple-100" />
        <div className="flex-1 text-center"><p className="font-black text-lg">{formatPrice(wallet.balance)}</p><p className="text-xs text-gray-400">Wallet</p></div>
      </div>

      <div className="mx-4 bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
        {["My Listings", "Favorites", "Payment Methods", "Notifications", "Help & Support"].map((label) => (
          <div key={label} className="px-4 py-4 border-b border-gray-50 text-sm font-semibold text-gray-700">{label}</div>
        ))}
      </div>

      <button onClick={logout} className="mx-4 w-[calc(100%-2rem)] flex items-center justify-center gap-2 bg-white rounded-2xl py-4 text-rose-500 font-bold shadow-sm">
        <LogOut className="w-5 h-5" /> Log Out
      </button>
      <p className="text-center text-gray-400 text-xs mt-6 mb-8">Hafi v1.0.0 · Made with 💜 in Rwanda</p>
    </div>
  );
}
