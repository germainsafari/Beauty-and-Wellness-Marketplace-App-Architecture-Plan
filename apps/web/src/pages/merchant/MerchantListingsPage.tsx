import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice, trpcCall } from "../../lib/api";
import { useApp } from "../../context/AppContext";

export default function MerchantListingsPage() {
  const { user } = useApp();
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    if (user) trpcCall("listings.list", { sellerId: user.id, limit: 50 }).then(setListings).catch(() => {});
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display">Listings</h1>
          <p className="text-gray-500">Vinted-style seller hub · 0% seller fees</p>
        </div>
        <Link to="/merchant/listings/new" className="bg-hafi-gold text-hafi-dark font-bold px-6 py-3 rounded-xl w-fit">+ New listing</Link>
      </div>

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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
