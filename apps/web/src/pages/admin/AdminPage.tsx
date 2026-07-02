import { useEffect, useState } from "react";
import { CheckCircle, ShieldCheck, Users, XCircle } from "lucide-react";
import { formatPrice, trpcCall } from "../../lib/api";
import { useApp } from "../../context/AppContext";

type Summary = {
  users: number;
  listings: number;
  bookings: number;
  revenue: string;
  pendingVerification: number;
};

type VerificationRow = {
  request: {
    id: number;
    documentType: string;
    documentUrl: string;
    status: "pending" | "approved" | "rejected";
    rejectionReason: string | null;
  };
  user: { id: number; name: string; phone: string | null; role: string; isVerified: boolean };
};

export default function AdminPage() {
  const { user, logout } = useApp();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [queue, setQueue] = useState<VerificationRow[]>([]);
  const [message, setMessage] = useState("");

  const load = () => {
    trpcCall<Summary>("admin.summary").then(setSummary).catch(() => {});
    trpcCall<any[]>("admin.users").then(setUsers).catch(() => {});
    trpcCall<VerificationRow[]>("admin.verificationQueue").then(setQueue).catch(() => {});
  };

  useEffect(load, []);

  const review = async (requestId: number, status: "approved" | "rejected") => {
    await trpcCall("admin.reviewVerification", { requestId, status, rejectionReason: status === "rejected" ? "Document is not readable enough." : undefined }, "mutation");
    setMessage(`Verification ${status}.`);
    load();
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
            <span className="text-sm text-purple-100">{user?.name}</span>
            <button onClick={logout} className="border border-white/20 rounded-xl px-4 py-2 text-sm font-bold">Log out</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {message && <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-3 text-sm font-semibold">{message}</div>}

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

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b flex items-center gap-2">
              <ShieldCheck className="text-hafi-purple" />
              <h2 className="font-black text-lg">Identity Verification Queue</h2>
            </div>
            <div className="divide-y">
              {queue.length === 0 ? (
                <p className="p-6 text-sm text-gray-400">No verification requests yet.</p>
              ) : queue.map((row) => (
                <div key={row.request.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-bold">{row.user.name}</p>
                    <p className="text-sm text-gray-500">{row.user.phone} · {row.request.documentType}</p>
                    <a className="text-sm text-hafi-purple font-semibold" href={row.request.documentUrl} target="_blank" rel="noreferrer">Open document</a>
                  </div>
                  <span className="text-xs font-bold uppercase bg-gray-100 px-3 py-1 rounded-full">{row.request.status}</span>
                  {row.request.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => review(row.request.id, "approved")} className="inline-flex items-center gap-1 bg-emerald-600 text-white rounded-xl px-3 py-2 text-sm font-bold"><CheckCircle size={16} /> Approve</button>
                      <button onClick={() => review(row.request.id, "rejected")} className="inline-flex items-center gap-1 bg-red-600 text-white rounded-xl px-3 py-2 text-sm font-bold"><XCircle size={16} /> Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b flex items-center gap-2">
              <Users className="text-hafi-purple" />
              <h2 className="font-black text-lg">Users</h2>
            </div>
            <div className="divide-y max-h-[520px] overflow-auto">
              {users.map((u) => (
                <div key={u.id} className="p-4">
                  <p className="font-bold text-sm">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.phone} · {u.role}</p>
                  <p className="text-xs mt-1">{u.isVerified ? "Verified" : "Not verified"}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
