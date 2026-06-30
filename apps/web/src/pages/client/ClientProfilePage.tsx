import { useApp } from "../../context/AppContext";

export default function ClientProfilePage() {
  const { user, logout, switchRole } = useApp();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-black font-display">Profile</h1>
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-hafi-purple text-white flex items-center justify-center text-2xl font-black">{user?.name?.[0]}</div>
          <div>
            <p className="font-bold text-xl">{user?.name}</p>
            <p className="text-gray-500">{user?.phone}</p>
            <span className="inline-block mt-1 text-xs bg-purple-100 text-hafi-purple px-2 py-0.5 rounded-full font-semibold">Client account</span>
          </div>
        </div>
        {["Payment methods", "Notifications", "Purchase history", "Help & support"].map((l) => (
          <div key={l} className="py-4 border-t text-sm font-semibold text-gray-700">{l}</div>
        ))}
      </div>
      <button onClick={() => switchRole("provider")} className="w-full bg-hafi-dark text-white font-bold py-4 rounded-xl">
        Switch to Merchant mode
      </button>
      <button onClick={logout} className="w-full border border-red-200 text-red-500 font-bold py-4 rounded-xl">Log out</button>
    </div>
  );
}
