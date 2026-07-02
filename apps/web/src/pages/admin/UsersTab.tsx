import { useEffect, useState } from "react";
import { BadgeCheck, Users } from "lucide-react";
import { trpcCall } from "../../lib/api";
import { DataTable, EmptyState, SectionCard, formatDateTime } from "./shared";

type UserRow = {
  id: number;
  name: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  location: string | null;
  createdAt: string;
};

export default function UsersTab({ onChanged }: { onChanged: (message: string) => void }) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    trpcCall<UserRow[]>("admin.users")
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleVerified = async (user: UserRow) => {
    setBusyId(user.id);
    try {
      await trpcCall("admin.setUserVerified", { userId: user.id, isVerified: !user.isVerified }, "mutation");
      onChanged(`${user.name} is now ${user.isVerified ? "unverified" : "verified"}.`);
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SectionCard title="Users" icon={<Users className="text-hafi-purple" />}>
      {rows.length === 0 ? (
        <EmptyState label={loading ? "Loading…" : "No users found."} />
      ) : (
        <DataTable headers={["User", "Role", "Location", "Joined", "Verified", "Actions"]}>
          {rows.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50/60">
              <td className="px-4 py-3">
                <p className="font-bold whitespace-nowrap">{u.name}</p>
                <p className="text-xs text-gray-500">{u.phone ?? "—"}</p>
              </td>
              <td className="px-4 py-3 capitalize">{u.role}</td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.location ?? "—"}</td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(u.createdAt)}</td>
              <td className="px-4 py-3">
                {u.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold">
                    <BadgeCheck size={14} /> Verified
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Not verified</span>
                )}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleVerified(u)}
                  disabled={busyId === u.id}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold border disabled:opacity-50 whitespace-nowrap ${
                    u.isVerified
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {u.isVerified ? "Remove badge" : "Mark verified"}
                </button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </SectionCard>
  );
}
