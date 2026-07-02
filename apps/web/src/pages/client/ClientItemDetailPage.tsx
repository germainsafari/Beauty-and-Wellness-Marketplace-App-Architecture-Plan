import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Shield,
} from "lucide-react";
import ListingCard, { type ListingCardItem } from "../../components/ListingCard";
import { formatPrice, trpcCall } from "../../lib/api";
import { useApp } from "../../context/AppContext";

export default function ClientItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const [item, setItem] = useState<any>(null);
  const [similar, setSimilar] = useState<ListingCardItem[]>([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [offer, setOffer] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [provider, setProvider] = useState<"demo" | "mtn_momo" | "airtel_money" | "stripe">("demo");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    trpcCall<any>("listings.byId", { id: Number(id) })
      .then((d) => {
        setItem(d);
        setOffer(String(Math.round(Number(d.price) * 0.85)));
        setImageIndex(0);
      })
      .catch(() => {});
    trpcCall<ListingCardItem[]>("listings.list", { limit: 6 })
      .then((items) => setSimilar(items.filter((l) => l.id !== Number(id)).slice(0, 4)))
      .catch(() => {});
    if (user) {
      trpcCall<number[]>("listings.myFavoriteIds")
        .then((ids) => setIsFavorite(ids.includes(Number(id))))
        .catch(() => {});
    }
  }, [id, user]);

  if (!item) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-hafi-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const images: string[] = item.images?.length ? item.images : [];
  const discount =
    item.originalPrice && Number(item.originalPrice) > Number(item.price)
      ? Math.round((1 - Number(item.price) / Number(item.originalPrice)) * 100)
      : null;

  const buyNow = async () => {
    setBusy(true);
    try {
      const result = await trpcCall<{ payment: { status: string; externalReference: string } }>(
        "commerce.buyNow",
        { listingId: item.id, provider, phone: phone || undefined },
        "mutation"
      );
      setMsg(
        result.payment.status === "succeeded"
          ? "Payment succeeded. The item is reserved for you."
          : `Payment request sent. Reference: ${result.payment.externalReference}`
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not start checkout");
    } finally {
      setBusy(false);
    }
  };

  const messageSeller = async () => {
    const convo = await trpcCall<{ id: number }>(
      "chat.startConversation",
      { otherUserId: item.seller.id, type: "listing", referenceId: item.id },
      "mutation"
    );
    navigate("/client/messages", { state: { conversationId: convo.id } });
  };

  const toggleFavorite = async () => {
    if (!user) return;
    await trpcCall("listings.toggleFavorite", { listingId: item.id }, "mutation");
    setIsFavorite((v) => !v);
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: item.title, text: `Check this out on Hafi: ${item.title}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setMsg("Share link copied.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <Link
        to="/client/marketplace"
        className="inline-flex items-center gap-2 text-hafi-purple text-sm font-semibold hover:underline"
      >
        <ArrowLeft size={16} /> Back to marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image gallery — Vinted style */}
        <div className="space-y-3">
          <div className="aspect-square bg-purple-50 rounded-2xl overflow-hidden relative group">
            {images[imageIndex] ? (
              <img src={images[imageIndex]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">💄</div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setImageIndex((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImageIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === imageIndex ? "bg-white w-4" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 ${
                    i === imageIndex ? "border-hafi-purple" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs font-bold uppercase bg-purple-100 text-hafi-purple px-3 py-1 rounded-full">
              {item.condition?.replace("_", " ")}
            </span>
            {item.isNegotiable && (
              <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">Open to offers</span>
            )}
            {discount && (
              <span className="text-xs font-bold bg-red-100 text-red-600 px-3 py-1 rounded-full">-{discount}%</span>
            )}
            {item.isBumped && (
              <span className="text-xs font-bold bg-hafi-gold text-white px-3 py-1 rounded-full">HOT</span>
            )}
          </div>

          {item.brand && <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{item.brand}</p>}
          <h1 className="text-2xl lg:text-3xl font-black font-display leading-tight">{item.title}</h1>

          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-black text-hafi-purple">{formatPrice(item.price)}</p>
            {item.originalPrice && Number(item.originalPrice) > Number(item.price) && (
              <p className="text-lg text-gray-400 line-through">{formatPrice(item.originalPrice)}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Heart size={14} className="text-red-300" /> {item.likes} likes</span>
            <span className="flex items-center gap-1"><Eye size={14} /> {item.views} views</span>
          </div>

          {/* Seller card */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-hafi-purple to-hafi-light text-white flex items-center justify-center font-bold text-lg">
              {item.seller?.name?.[0]}
            </div>
            <div className="flex-1">
              <p className="font-bold flex items-center gap-1">
                {item.seller?.name}
                {item.seller?.isVerified && <CheckCircle size={16} className="text-hafi-purple" />}
              </p>
              <p className="text-sm text-gray-500">📍 {item.seller?.location || item.location || "Rwanda"}</p>
            </div>
            <button onClick={toggleFavorite} className={`p-2.5 rounded-xl border ${isFavorite ? "bg-red-50 border-red-200 text-red-500" : "hover:bg-gray-50"}`}>
              <Heart size={20} className={isFavorite ? "fill-current" : ""} />
            </button>
            <button onClick={messageSeller} className="p-2.5 border rounded-xl hover:bg-purple-50">
              <MessageCircle size={20} className="text-hafi-purple" />
            </button>
          </div>

          <p className="text-gray-600 leading-relaxed">{item.description}</p>

          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl text-sm">
            <Shield className="text-hafi-purple flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold text-hafi-purple">Buyer Protection</p>
              <p className="text-gray-600 mt-1">Pay through Hafi escrow. Refund if item isn't as described. 5% protection fee at checkout.</p>
            </div>
          </div>

          {msg && <p className="text-emerald-600 font-semibold text-sm bg-emerald-50 px-4 py-2 rounded-xl">{msg}</p>}

          {showOffer ? (
            <div className="space-y-3 bg-white p-4 rounded-2xl border">
              <p className="text-sm font-bold">Your offer (RWF)</p>
              <input className="w-full border rounded-xl px-4 py-3 font-bold text-lg" value={offer} onChange={(e) => setOffer(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => setShowOffer(false)} className="flex-1 border py-3 rounded-xl font-bold text-gray-600">Cancel</button>
                <button
                  onClick={async () => {
                    await trpcCall("listings.createOffer", { listingId: item.id, amount: Number(offer) }, "mutation");
                    setMsg("Offer sent! The seller will respond in Messages.");
                    setShowOffer(false);
                  }}
                  className="flex-1 bg-hafi-purple text-white font-bold py-3 rounded-xl"
                >
                  Send offer
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sticky bottom-4 lg:static bg-white/95 backdrop-blur lg:bg-transparent p-4 lg:p-0 rounded-2xl lg:rounded-none border lg:border-0 shadow-lg lg:shadow-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select value={provider} onChange={(e) => setProvider(e.target.value as typeof provider)} className="border rounded-xl px-4 py-3 text-sm font-semibold bg-white">
                  <option value="demo">Demo instant pay</option>
                  <option value="mtn_momo">MTN MoMo request</option>
                  <option value="airtel_money">Airtel Money request</option>
                  <option value="stripe">Card via Stripe</option>
                </select>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250..." className="border rounded-xl px-4 py-3 text-sm" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {item.isNegotiable && (
                  <button onClick={() => setShowOffer(true)} className="flex-1 border-2 border-hafi-purple text-hafi-purple font-bold py-4 rounded-xl">
                    Make offer
                  </button>
                )}
                <button
                  onClick={buyNow}
                  disabled={busy}
                  className="flex-1 bg-gradient-to-r from-hafi-gold to-amber-400 text-white font-bold py-4 rounded-xl disabled:opacity-60 shadow-md"
                >
                  {busy ? "Processing..." : "Buy now"}
                </button>
                <button onClick={share} className="sm:w-14 border rounded-xl flex items-center justify-center py-4 hover:bg-gray-50">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="text-xl font-black mb-4">You might also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {similar.map((l) => (
              <ListingCard key={l.id} item={l} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
