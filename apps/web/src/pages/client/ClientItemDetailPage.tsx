import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, MessageCircle, Shield } from "lucide-react";
import { formatPrice, trpcCall } from "../../lib/api";

export default function ClientItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<any>(null);
  const [offer, setOffer] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (id) trpcCall("listings.byId", { id: Number(id) }).then((d) => { setItem(d); setOffer(String(Math.round(Number(d.price) * 0.85))); }).catch(() => {});
  }, [id]);

  if (!item) return <div className="py-20 text-center text-gray-400">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/client/marketplace" className="inline-flex items-center gap-2 text-hafi-purple mb-6 text-sm font-semibold"><ArrowLeft size={16} /> Back to marketplace</Link>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square lg:aspect-auto lg:min-h-[500px] bg-purple-50 rounded-2xl overflow-hidden">
          {item.images?.[0] ? <img src={item.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-8xl">💄</div>}
        </div>
        <div className="space-y-6">
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase bg-purple-100 text-hafi-purple px-3 py-1 rounded-full">{item.condition?.replace("_", " ")}</span>
            {item.isNegotiable && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">Open to offers</span>}
          </div>
          <h1 className="text-2xl lg:text-3xl font-black font-display">{item.title}</h1>
          <p className="text-3xl font-black text-hafi-purple">{formatPrice(item.price)}</p>
          <div className="flex items-center gap-4 p-4 bg-hafi-bg rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-hafi-purple text-white flex items-center justify-center font-bold text-lg">{item.seller?.name?.[0]}</div>
            <div>
              <p className="font-bold flex items-center gap-1">{item.seller?.name} {item.seller?.isVerified && <CheckCircle size={16} className="text-hafi-purple" />}</p>
              <p className="text-sm text-gray-500">📍 {item.seller?.location || "Rwanda"}</p>
            </div>
            <Link to="/client/messages" className="ml-auto p-2 border rounded-xl hover:bg-white"><MessageCircle size={20} className="text-hafi-purple" /></Link>
          </div>
          <p className="text-gray-600 leading-relaxed">{item.description}</p>
          <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl text-sm">
            <Shield className="text-hafi-purple flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold text-hafi-purple">Buyer Protection</p>
              <p className="text-gray-600 mt-1">Pay through Hafi escrow. Refund if item isn't as described. 5% protection fee at checkout.</p>
            </div>
          </div>
          {msg && <p className="text-emerald-600 font-semibold text-sm">{msg}</p>}
          {showOffer ? (
            <div className="space-y-3">
              <input className="w-full border rounded-xl px-4 py-3 font-bold" value={offer} onChange={(e) => setOffer(e.target.value)} />
              <button onClick={async () => { await trpcCall("listings.createOffer", { listingId: item.id, amount: Number(offer) }, "mutation"); setMsg("Offer sent!"); setShowOffer(false); }} className="w-full bg-hafi-purple text-white font-bold py-4 rounded-xl">Send offer</button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              {item.isNegotiable && <button onClick={() => setShowOffer(true)} className="flex-1 border-2 border-hafi-purple text-hafi-purple font-bold py-4 rounded-xl">Make offer</button>}
              <button className="flex-1 bg-gradient-to-r from-hafi-gold to-amber-400 text-white font-bold py-4 rounded-xl">Buy now</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
