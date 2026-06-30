import { useCallback, useEffect, useState } from "react";
import { formatPrice, trpcCall } from "../../lib/api";

type Offer = {
  id: number;
  amount: string;
  status: string;
  message: string | null;
  counterAmount: string | null;
  listing: { id: number; title: string; price: string };
  buyer: { id: number; name: string };
};

export default function MerchantOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [counterFor, setCounterFor] = useState<number | null>(null);
  const [counterAmount, setCounterAmount] = useState("");

  const load = useCallback(() => {
    trpcCall<Offer[]>("merchant.offers")
      .then(setOffers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const respond = async (offerId: number, action: "accept" | "decline" | "counter", amount?: number) => {
    setActing(offerId);
    try {
      await trpcCall("merchant.respondToOffer", {
        offerId,
        action,
        counterAmount: amount,
      }, "mutation");
      setCounterFor(null);
      load();
    } catch {
      /* user sees stale list */
    } finally {
      setActing(null);
    }
  };

  const pending = offers.filter((o) => o.status === "pending");
  const resolved = offers.filter((o) => o.status !== "pending");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black font-display">Offer inbox</h1>
      <p className="text-gray-500">Accept, decline, or counter — Vinted negotiation flow</p>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading offers...</div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border">No offers yet</div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-700">Pending ({pending.length})</h2>
              {pending.map((o) => (
                <OfferCard
                  key={o.id}
                  offer={o}
                  acting={acting === o.id}
                  counterFor={counterFor}
                  counterAmount={counterAmount}
                  onCounterAmountChange={setCounterAmount}
                  onShowCounter={() => {
                    setCounterFor(o.id);
                    setCounterAmount(String(Math.round(Number(o.listing.price) * 0.9)));
                  }}
                  onCancelCounter={() => setCounterFor(null)}
                  onAccept={() => respond(o.id, "accept")}
                  onDecline={() => respond(o.id, "decline")}
                  onSendCounter={() => respond(o.id, "counter", Number(counterAmount))}
                />
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-700">Resolved</h2>
              {resolved.map((o) => (
                <div key={o.id} className="bg-white rounded-2xl p-5 border opacity-75">
                  <p className="font-bold">{o.listing.title}</p>
                  <p className="text-sm text-gray-500">From {o.buyer.name}</p>
                  <p className="text-hafi-purple font-black text-lg mt-1">{formatPrice(o.amount)}</p>
                  <span className="inline-block mt-2 text-xs font-bold capitalize px-3 py-1 rounded-full bg-gray-100">
                    {o.status}
                    {o.counterAmount ? ` · counter ${formatPrice(o.counterAmount)}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OfferCard({
  offer,
  acting,
  counterFor,
  counterAmount,
  onCounterAmountChange,
  onShowCounter,
  onCancelCounter,
  onAccept,
  onDecline,
  onSendCounter,
}: {
  offer: Offer;
  acting: boolean;
  counterFor: number | null;
  counterAmount: string;
  onCounterAmountChange: (v: string) => void;
  onShowCounter: () => void;
  onCancelCounter: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onSendCounter: () => void;
}) {
  const isCountering = counterFor === offer.id;

  return (
    <div className="bg-white rounded-2xl p-5 border shadow-sm flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1">
        <p className="font-bold">{offer.listing.title}</p>
        <p className="text-sm text-gray-500">
          From {offer.buyer.name} · Listed at {formatPrice(offer.listing.price)}
        </p>
        <p className="text-hafi-purple font-black text-xl mt-1">{formatPrice(offer.amount)}</p>
        {offer.message && <p className="text-sm text-gray-600 mt-2 italic">"{offer.message}"</p>}
      </div>

      {isCountering ? (
        <div className="flex flex-col gap-2 min-w-[200px]">
          <input
            type="number"
            value={counterAmount}
            onChange={(e) => onCounterAmountChange(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
            placeholder="Counter amount (RWF)"
          />
          <button
            onClick={onSendCounter}
            disabled={acting}
            className="bg-hafi-purple text-white font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-50"
          >
            Send counter
          </button>
          <button onClick={onCancelCounter} className="text-sm text-gray-500">Cancel</button>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onAccept}
            disabled={acting}
            className="bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-50"
          >
            Accept
          </button>
          <button
            onClick={onShowCounter}
            disabled={acting}
            className="border font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-50"
          >
            Counter
          </button>
          <button
            onClick={onDecline}
            disabled={acting}
            className="text-red-500 font-bold px-4 py-2 text-sm disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}
