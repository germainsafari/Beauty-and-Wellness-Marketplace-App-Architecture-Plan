import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice, trpcCall } from "../../lib/api";
import { useApp } from "../../context/AppContext";

export default function MerchantListingsPage() {
  const { user } = useApp();
  const [listings, setListings] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [bundleMin, setBundleMin] = useState(2);
  const [bundleDiscount, setBundleDiscount] = useState(10);

  const load = () => {
    if (user) trpcCall<any[]>("listings.list", { sellerId: user.id, limit: 50 }).then(setListings).catch(() => {});
  };

  useEffect(load, [user]);

  const boost = async (listingId: number) => {
    await trpcCall("commerce.boostListing", { listingId, days: 7, provider: "demo" }, "mutation");
    setMessage("Listing boosted for 7 days.");
    load();
  };

  const saveBundle = async () => {
    await trpcCall("commerce.saveBundleRule", { minItems: bundleMin, discountPercent: bundleDiscount }, "mutation");
    setMessage("Bundle discount saved.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display">Listings</h1>
          <p className="text-gray-500">Seller hub for products, tools, parts, and supplies</p>
        </div>
        <Link to="/merchant/listings/new" className="bg-hafi-gold text-hafi-dark font-bold px-6 py-3 rounded-xl w-fit">+ New listing</Link>
      </div>

      {message && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-semibold">{message}</div>}

      <section className="bg-white rounded-2xl border p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <p className="font-black">Bundle discounts</p>
          <p className="text-sm text-gray-500">Encourage buyers to purchase multiple products, tools, parts, or supplies from your shop.</p>
        </div>
        <input type="number" min={2} max={10} value={bundleMin} onChange={(e) => setBundleMin(Number(e.target.value))} className="border rounded-xl px-3 py-2 w-28" />
        <input type="number" min={1} max={50} value={bundleDiscount} onChange={(e) => setBundleDiscount(Number(e.target.value))} className="border rounded-xl px-3 py-2 w-28" />
        <button onClick={saveBundle} className="bg-hafi-purple text-white rounded-xl px-4 py-2 font-bold">Save</button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {listings.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl overflow-hidden border shadow-sm">
            <div className="aspect-video bg-purple-50">
              {item.images?.[0] && <img src={item.images[0]} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="p-4">
              <p className="font-bold truncate">{item.title}</p>
              <p className="text-hafi-purple font-black">{formatPrice(item.price)}</p>
              <div className="flex gap-4 text-xs text-gray-400 mt-2">
                <span>{item.views} views</span>
                <span>{item.likes} likes</span>
                <span className="capitalize">{item.status}</span>
              </div>
              <button onClick={() => boost(item.id)} className="mt-4 w-full bg-hafi-dark text-white rounded-xl py-2 text-sm font-bold">
                {item.isBumped ? "Boosted" : "Boost for 7 days"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
