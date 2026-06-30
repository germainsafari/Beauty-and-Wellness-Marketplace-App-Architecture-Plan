import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function WelcomePage() {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+250");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(name.trim(), phone.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-hafi-dark via-hafi-mid to-purple-800 px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-hafi-light to-hafi-purple flex items-center justify-center mb-6 shadow-2xl">
        <span className="text-4xl font-black text-white font-display">H</span>
      </div>
      <h1 className="text-4xl font-black text-white font-display mb-2">Welcome to Hafi</h1>
      <p className="text-purple-200 font-semibold mb-1">Beauty & Wellness Marketplace</p>
      <p className="text-purple-300 text-sm mb-8 max-w-xs">
        Book beauty services, shop pre-loved products, and connect with top professionals in Rwanda.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <input
          className="w-full rounded-2xl px-4 py-3.5 text-gray-800"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded-2xl px-4 py-3.5 text-gray-800"
          placeholder="+250 7XX XXX XXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        {error && <p className="text-red-300 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-hafi-gold to-amber-300 text-white font-black py-4 rounded-2xl text-lg shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Get Started"}
        </button>
      </form>
      <p className="text-purple-400 text-xs mt-4">Free to join · No credit card required</p>
    </div>
  );
}
