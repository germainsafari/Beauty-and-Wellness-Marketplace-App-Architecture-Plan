import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Shield } from "lucide-react";
import { formatPrice, trpcCall } from "../lib/api";

type Listing = {
  id: number;
  title: string;
  description: string | null;
  price: string;
  originalPrice: string | null;
  condition: string;
  images: string[];
  isNegotiable: boolean;
  brand: string | null;
  seller: { id: number; name: string; isVerified: boolean; location: string | null };
};

export default function ItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Listing | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    trpcCall<Listing>("listings.byId", { id: Number(id) })
      .then((data) => {
        setItem(data);
        setOfferAmount(String(Math.round(Number(data.price) * 0.85)));
      })
      .catch(() => setItem(null));
  }, [id]);

  const sendOffer = async () => {
    if (!item) return;
    try {
      await trpcCall("listings.createOffer", {
        listingId: item.id,
        amount: Number(offerAmount),
        message: "Hi! I'd love to buy this 💜",
      }, "mutation");
      setMsg("Offer sent! ✨");
      setShowOffer(false);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  };

  if (!item) {
    return (
      <div className="p-8 text-center">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-hafi-purple mb-4"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <Link to="/marketplace" className="inline-flex items-center gap-2 text-hafi-purple p-4"><ArrowLeft className="w-4 h-4" /> Marketplace</Link>
      <div className="aspect-square bg-purple-50 max-h-80">
        {item.images?.[0] ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-6xl">💄</div>}
      </div>
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <span className="bg-purple-100 text-hafi-purple text-xs font-bold px-3 py-1 rounded-full uppercase">{item.condition.replace("_", " ")}</span>
          {item.isNegotiable && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">Negotiable</span>}
        </div>
        <h1 className="text-2xl font-black font-display">{item.title}</h1>
        {item.brand && <p className="text-gray-400">{item.brand}</p>}
        <p className="text-3xl font-black text-hafi-purple">{formatPrice(item.price)}</p>
        {item.originalPrice && <p className="text-gray-400 line-through text-sm">{formatPrice(item.originalPrice)}</p>}

        <div className="flex items-center gap-3 bg-hafi-bg rounded-2xl p-4">
          <div className="w-12 h-12 rounded-full bg-hafi-purple text-white flex items-center justify-center font-black text-lg">{item.seller.name[0]}</div>
          <div>
            <p className="font-bold flex items-center gap-1">{item.seller.name} {item.seller.isVerified && <CheckCircle className="w-4 h-4 text-hafi-purple" />}</p>
            <p className="text-xs text-gray-400">📍 {item.seller.location || "Rwanda"}</p>
          </div>
        </div>

        <p className="text-gray-600 leading-relaxed">{item.description}</p>

        <div className="flex items-center gap-2 bg-purple-50 rounded-xl p-3 text-sm text-hafi-purple font-semibold">
          <Shield className="w-5 h-5" /> Buyer Protection — Escrow secured until delivery
        </div>

        {msg && <p className="text-emerald-600 text-sm font-semibold">{msg}</p>}

        {showOffer ? (
          <div className="space-y-3">
            <input className="w-full border rounded-xl px-4 py-3 font-bold" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} />
            <button onClick={sendOffer} className="w-full bg-hafi-purple text-white font-bold py-4 rounded-2xl">Send Offer</button>
          </div>
        ) : (
          <div className="flex gap-3">
            {item.isNegotiable && (
              <button onClick={() => setShowOffer(true)} className="flex-1 border-2 border-hafi-purple text-hafi-purple font-bold py-4 rounded-2xl">Make Offer</button>
            )}
            <button className="flex-1 bg-gradient-to-r from-hafi-gold to-amber-300 text-white font-bold py-4 rounded-2xl">Buy Now — Escrow</button>
          </div>
        )}
      </div>
    </div>
  );
}
