import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { trpcCall } from "../../lib/api";

export default function MerchantProfilePage() {
  const { user, logout, switchRole } = useApp();
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    businessName: "",
    description: "",
    address: "",
    name: "",
    bio: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    trpcCall("merchant.dashboard")
      .then((data) => {
        setProfile(data.profile);
        setForm({
          businessName: data.profile.businessName ?? "",
          description: data.profile.description ?? "",
          address: data.profile.address ?? "",
          name: user?.name ?? "",
          bio: user?.bio ?? "",
          location: user?.location ?? "",
        });
      })
      .catch(() => {});
  }, [user]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await trpcCall("merchant.updateProfile", form, "mutation");
      setProfile(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-black font-display">Business profile</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-hafi-gold text-hafi-dark flex items-center justify-center text-2xl font-black">
            {user?.name?.[0]}
          </div>
          <div>
            <p className="font-bold text-xl">{profile?.businessName ?? user?.name}</p>
            <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
              Merchant account
            </span>
            {profile?.rating && (
              <p className="text-sm text-gray-500 mt-1">⭐ {profile.rating} · {profile.reviewCount} reviews</p>
            )}
          </div>
        </div>

        {[
          { key: "businessName", label: "Business name" },
          { key: "name", label: "Your name" },
          { key: "address", label: "Address" },
          { key: "location", label: "City / area" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="text-sm font-semibold text-gray-600">{label}</label>
            <input
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full mt-1 border rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
        ))}

        <div>
          <label className="text-sm font-semibold text-gray-600">Business description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full mt-1 border rounded-xl px-4 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={2}
            className="w-full mt-1 border rounded-xl px-4 py-2.5 text-sm"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-hafi-purple text-white font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save profile"}
        </button>
      </div>

      <button
        onClick={() => switchRole("customer")}
        className="w-full bg-hafi-purple text-white font-bold py-4 rounded-xl"
      >
        Switch to Client mode
      </button>
      <button onClick={logout} className="w-full border border-red-200 text-red-500 font-bold py-4 rounded-xl">
        Log out
      </button>
    </div>
  );
}
