import { useState } from "react";
import { Calendar, ShoppingBag, Sparkles, Store } from "lucide-react";
import { useApp, type UserRole } from "../context/AppContext";

export default function RoleSelectionPage() {
  const { login, setSelectedRole, selectedRole } = useApp();
  const [role, setRole] = useState<UserRole>(selectedRole ?? "customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+250");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      setSelectedRole(role);
      await login(name.trim(), phone.trim(), role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero — full width on mobile, half on desktop */}
      <div className="lg:w-1/2 bg-gradient-to-br from-hafi-dark via-hafi-mid to-purple-800 text-white p-8 lg:p-16 flex flex-col justify-center">
        <div className="max-w-md mx-auto lg:mx-0 w-full">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-hafi-light to-hafi-purple flex items-center justify-center mb-8 shadow-2xl">
            <span className="text-3xl font-black font-display">H</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black font-display mb-4 leading-tight">
            Beauty & wellness, your way
          </h1>
          <p className="text-purple-200 text-lg mb-8 leading-relaxed">
            Book salon appointments like Booksy. Shop pre-loved beauty like Vinted. One platform for Rwanda's glow-up generation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {[
              { icon: Calendar, text: "Book 24/7" },
              { icon: ShoppingBag, text: "Shop & sell" },
              { icon: Sparkles, text: "AI concierge" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-purple-100">
                <Icon size={18} className="text-hafi-gold" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-black font-display text-hafi-dark mb-2">Get started</h2>
          <p className="text-gray-500 mb-8">Choose how you'll use Hafi</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                role === "customer"
                  ? "border-hafi-purple bg-purple-50 shadow-md"
                  : "border-gray-100 hover:border-purple-200"
              }`}
            >
              <Calendar className={`w-8 h-8 mb-3 ${role === "customer" ? "text-hafi-purple" : "text-gray-400"}`} />
              <p className="font-bold text-hafi-dark">I'm a Client</p>
              <p className="text-xs text-gray-500 mt-1">Book services & shop marketplace</p>
            </button>
            <button
              type="button"
              onClick={() => setRole("provider")}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                role === "provider"
                  ? "border-hafi-gold bg-amber-50 shadow-md"
                  : "border-gray-100 hover:border-amber-200"
              }`}
            >
              <Store className={`w-8 h-8 mb-3 ${role === "provider" ? "text-hafi-gold" : "text-gray-400"}`} />
              <p className="font-bold text-hafi-dark">I'm a Merchant</p>
              <p className="text-xs text-gray-500 mt-1">Run salon & sell products</p>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-hafi-purple/30"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-hafi-purple/30"
              placeholder="+250 7XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-hafi-purple to-hafi-light text-white font-bold py-4 rounded-xl hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Signing in..." : role === "provider" ? "Open Merchant Dashboard" : "Enter as Client"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
