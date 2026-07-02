import { useEffect, useState } from "react";
import { CheckCircle, ShieldCheck, XCircle } from "lucide-react";
import { trpcCall } from "../../lib/api";
import { EmptyState, SectionCard, StatusBadge, resolveUploadUrl } from "./shared";

export type VerificationRow = {
  request: {
    id: number;
    documentType: string;
    documentUrl: string;
    status: "pending" | "approved" | "rejected";
    rejectionReason: string | null;
  };
  user: { id: number; name: string; phone: string | null; role: string; isVerified: boolean };
};

export default function VerificationTab({ onChanged }: { onChanged: (message: string) => void }) {
  const [queue, setQueue] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    trpcCall<VerificationRow[]>("admin.verificationQueue")
      .then(setQueue)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const review = async (requestId: number, status: "approved" | "rejected") => {
    await trpcCall(
      "admin.reviewVerification",
      { requestId, status, rejectionReason: status === "rejected" ? "Document is not readable enough." : undefined },
      "mutation"
    );
    onChanged(`Verification ${status}.`);
    load();
  };

  return (
    <SectionCard title="Identity Verification Queue" icon={<ShieldCheck className="text-hafi-purple" />}>
      <div className="divide-y">
        {queue.length === 0 ? (
          <EmptyState label={loading ? "Loading…" : "No verification requests yet."} />
        ) : (
          queue.map((row) => (
            <div key={row.request.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="font-bold">{row.user.name}</p>
                <p className="text-sm text-gray-500">
                  {row.user.phone} · {row.request.documentType.replace(/_/g, " ")}
                </p>
                <a
                  className="text-sm text-hafi-purple font-semibold"
                  href={resolveUploadUrl(row.request.documentUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open document
                </a>
              </div>
              <StatusBadge value={row.request.status} />
              {row.request.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => review(row.request.id, "approved")}
                    className="inline-flex items-center gap-1 bg-emerald-600 text-white rounded-xl px-3 py-2 text-sm font-bold"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={() => review(row.request.id, "rejected")}
                    className="inline-flex items-center gap-1 bg-red-600 text-white rounded-xl px-3 py-2 text-sm font-bold"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}
