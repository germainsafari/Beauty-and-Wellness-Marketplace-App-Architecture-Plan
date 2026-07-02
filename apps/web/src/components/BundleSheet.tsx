import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { formatPrice, getApiUrl, getToken } from "../lib/api";

export type BundleQuote = {
  items: { id: number }[];
  subtotal: number;
  discount: number;
  total: number;
  discountPercent: number;
};

type SellerItem = {
  id: number;
  title: string;
  price: string;
  condition: string;
  images: string[];
};

type Props = {
  listingId: number;
  sellerId: number;
  sellerName?: string;
  onSelectionChange: (ids: number[], quote: BundleQuote | null) => void;
};

async function trpcQuery<T>(path: string, input: unknown): Promise<T> {
  const base = getApiUrl();
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}/trpc/${path}?input=${encodeURIComponent(JSON.stringify(input))}`, { headers });
  const json = await res.json();
  if (json.error) throw new Error(json.error?.message || "Request failed");
  return json.result.data as T;
}

export default function BundleSheet({ listingId, sellerId, sellerName, onSelectionChange }: Props) {
  const [items, setItems] = useState<SellerItem[]>([]);
  const [rulePercent, setRulePercent] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [quote, setQuote] = useState<BundleQuote | null>(null);
  const [quoting, setQuoting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setItems([]);
    setSelected([]);
    setQuote(null);
    trpcQuery<SellerItem[]>("listings.list", { sellerId, limit: 10 })
      .then(async (list) => {
        const others = list.filter((l) => l.id !== listingId).slice(0, 4);
        if (others.length === 0) return;
        const probe = await trpcQuery<BundleQuote>("commerce.quoteBundle", {
          listingIds: [listingId, ...others.map((o) => o.id)],
        });
        if (!cancelled && probe.discountPercent > 0) {
          setItems(others);
          setRulePercent(probe.discountPercent);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [listingId, sellerId]);

  useEffect(() => {
    if (selected.length === 0) {
      setQuote(null);
      onSelectionChange([], null);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    trpcQuery<BundleQuote>("commerce.quoteBundle", { listingIds: [listingId, ...selected] })
      .then((q) => {
        if (cancelled) return;
        setQuote(q);
        onSelectionChange(selected, q);
      })
      .catch(() => {
        if (cancelled) return;
        setQuote(null);
        onSelectionChange(selected, null);
      })
      .finally(() => {
        if (!cancelled) setQuoting(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, listingId]);

  if (items.length === 0) return null;

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Package size={18} className="text-hafi-purple" />
        <p className="font-bold">Bundle &amp; save</p>
        <span className="text-xs font-bold bg-purple-100 text-hafi-purple px-2.5 py-0.5 rounded-full">
          -{rulePercent}% on bundles
        </span>
      </div>
      <p className="text-sm text-gray-500">
        Add more items from {sellerName || "this seller"} and save {rulePercent}% on the whole bundle.
      </p>
      <div className="space-y-2">
        {items.map((it) => (
          <label
            key={it.id}
            className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
              selected.includes(it.id) ? "border-hafi-purple bg-purple-50" : "border-gray-100 hover:bg-gray-50"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(it.id)}
              onChange={() => toggle(it.id)}
              className="w-4 h-4 accent-hafi-purple"
            />
            <div className="w-11 h-11 rounded-lg bg-purple-50 overflow-hidden flex-shrink-0">
              {it.images?.[0] ? (
                <img src={it.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">✨</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold line-clamp-1">{it.title}</p>
              <p className="text-xs text-gray-400 capitalize">{it.condition?.replace("_", " ")}</p>
            </div>
            <p className="text-sm font-bold text-hafi-purple">{formatPrice(it.price)}</p>
          </label>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="bg-purple-50 rounded-xl p-3 space-y-1 text-sm">
          {quoting && !quote ? (
            <p className="text-gray-500">Calculating your bundle price...</p>
          ) : quote ? (
            <>
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({selected.length + 1} items)</span>
                <span>{formatPrice(quote.subtotal)}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-600">
                <span>Bundle discount ({quote.discountPercent}%)</span>
                <span>-{formatPrice(quote.discount)}</span>
              </div>
              <div className="flex justify-between font-black text-hafi-purple border-t border-purple-100 pt-1.5">
                <span>Bundle total</span>
                <span>{formatPrice(quote.total)}</span>
              </div>
              <p className="text-[11px] text-gray-400">+5% buyer protection fee at checkout</p>
            </>
          ) : (
            <p className="text-gray-500">Could not quote this bundle. Try different items.</p>
          )}
        </div>
      )}
    </div>
  );
}
