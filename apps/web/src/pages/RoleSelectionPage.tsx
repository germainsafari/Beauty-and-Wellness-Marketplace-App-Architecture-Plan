import { useState } from "react";
import { BriefcaseBusiness, Home, Store } from "lucide-react";
import { useT } from "@hafi/i18n";
import OnboardingCarousel from "../components/OnboardingCarousel";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { DEMO_ACCOUNTS } from "../lib/onboarding";
import { useApp, type UserRole } from "../context/AppContext";

export default function RoleSelectionPage() {
  const { login, signIn, setSelectedRole, selectedRole } = useApp();
  const t = useT();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<UserRole>(selectedRole ?? "customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+250");
  const [interest, setInterest] = useState("Beauty & wellness");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "signin") {
        await signIn(phone.trim());
      } else {
        setSelectedRole(role);
        await login(name.trim(), phone.trim(), role);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue");
    } finally {
      setLoading(false);
    }
  };

  const quickSignIn = async (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setPhone(account.phone);
    setLoading(true);
    setError("");
    try {
      await signIn(account.phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-hafi-bg">
      <OnboardingCarousel />

      <section className="flex items-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="w-full max-w-md mx-auto">
          <div className="inline-grid grid-cols-2 bg-white border border-purple-100 rounded-2xl p-1 mb-4 w-full shadow-sm">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`px-5 py-3 rounded-xl text-sm font-black ${mode === "signin" ? "bg-hafi-purple text-white shadow" : "text-gray-500"}`}
            >
              {t("common.signIn")}
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`px-5 py-3 rounded-xl text-sm font-black ${mode === "signup" ? "bg-hafi-purple text-white shadow" : "text-gray-500"}`}
            >
              {t("common.createAccount")}
            </button>
          </div>

          <LanguageSwitcher />

          <h2 className="text-3xl font-black font-display text-hafi-dark mt-6">
            {mode === "signin" ? t("common.welcomeBack") : t("common.joinHafi")}
          </h2>
          <p className="text-gray-500 mt-2 mb-6">
            {mode === "signin" ? t("auth.signInHint") : t("auth.signUpHint")}
          </p>

          {mode === "signin" && (
            <div className="grid grid-cols-2 gap-2 mb-6">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.phone}
                  type="button"
                  onClick={() => quickSignIn(account)}
                  className="text-left bg-white border border-purple-100 rounded-2xl px-4 py-3 hover:border-hafi-purple hover:bg-purple-50 transition-colors shadow-sm"
                >
                  <p className="text-[10px] font-bold text-hafi-purple uppercase">{account.label}</p>
                  <p className="font-black text-sm">{account.name}</p>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("customer")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${role === "customer" ? "border-hafi-purple bg-purple-50 shadow-sm" : "border-gray-100 bg-white"}`}
                  >
                    <Home className="text-hafi-purple mb-2" size={22} />
                    <p className="font-black text-sm">{t("common.client")}</p>
                    <p className="text-[11px] text-gray-500">{t("auth.bookAndShop")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("provider")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${role === "provider" ? "border-hafi-gold bg-amber-50 shadow-sm" : "border-gray-100 bg-white"}`}
                  >
                    <Store className="text-hafi-gold mb-2" size={22} />
                    <p className="font-black text-sm">{t("common.merchant")}</p>
                    <p className="text-[11px] text-gray-500">{t("auth.offerServices")}</p>
                  </button>
                </div>
                <input
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-hafi-purple/30"
                  placeholder={t("auth.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <select
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 outline-none"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                >
                  {[
                    "Beauty & wellness",
                    "Home services",
                    "Auto repair",
                    "Cleaning",
                    "Retail marketplace",
                    "Other trades",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </>
            )}

            <input
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-hafi-purple/30"
              placeholder={t("auth.phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-hafi-purple to-violet-600 text-white font-black py-4 rounded-2xl hover:shadow-lg disabled:opacity-60"
            >
              {loading
                ? t("common.pleaseWait")
                : mode === "signin"
                  ? t("common.signIn")
                  : role === "provider"
                    ? t("auth.createMerchant")
                    : t("auth.createClient")}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-2 text-xs text-gray-400">
            <BriefcaseBusiness size={16} />
            {t("auth.trustedRwanda")}
          </div>
        </div>
      </section>
    </div>
  );
}
