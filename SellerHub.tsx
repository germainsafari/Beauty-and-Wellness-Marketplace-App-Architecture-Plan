import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { BarChart3, CheckCircle, Eye, Heart, Loader2, Plus, ShoppingBag, Tag, TrendingUp, Wallet, X, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";

export default function SellerHub() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"listings" | "offers" | "sales" | "analytics">("listings");

  const { data: myListings, isLoading: loadingListings } = trpc.listings.myListings.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myOffers, isLoading: loadingOffers } = trpc.offers.myReceivedOffers.useQuery(undefined, { enabled: isAuthenticated });
  const { data: walletData } = trpc.wallet.balance.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const respondOffer = trpc.offers.respond.useMutation({
    onSuccess: () => { toast.success("Offer updated!"); utils.offers.myReceivedOffers.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteListing = trpc.listings.delete.useMutation({
    onSuccess: () => { toast.success("Listing removed"); utils.listings.myListings.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-black text-[#1A0533] mb-2">Your Seller Hub</h2>
          <p className="text-gray-400 mb-6">Sign in to manage your listings, track earnings, and respond to offers</p>
          <a href={getLoginUrl()}><button className="bg-gradient-to-r from-[#6C3FC5] to-[#9B6FE8] text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-purple-200">Sign In</button></a>
        </div>
      </AppLayout>
    );
  }

  const activeListings = myListings?.filter((l: any) => l.status === "active").length || 0;
  const pendingOffers = myOffers?.filter((o: any) => o.status === "pending").length || 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-[#1A0533]">Seller Hub</h1>
            <p className="text-gray-400 text-sm">Manage your listings & earnings</p>
          </div>
          <Link href="/create-listing">
            <button className="flex items-center gap-2 bg-gradient-to-r from-[#F5A623] to-[#F7C05A] text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-amber-200 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm">
              <Plus className="w-4 h-4" /> New Listing
            </button>
          </Link>
        </div>

        {/* Wallet card */}
        <div className="bg-gradient-to-br from-[#6C3FC5] to-[#9B6FE8] rounded-2xl p-5 mb-5 text-white shadow-lg shadow-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-200 text-sm font-medium">Wallet Balance</p>
              <p className="text-3xl font-black mt-1">RWF {Number(walletData?.balance || 0).toLocaleString()}</p>
              <p className="text-purple-200 text-xs mt-1">Pending: RWF {Number((walletData as any)?.pendingBalance || 0).toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Wallet className="w-6 h-6 text-white" /></div>
          </div>
          <button onClick={() => toast.info("MoMo withdrawal — coming soon!")} className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">Withdraw via MTN MoMo</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Active Listings", value: activeListings, icon: ShoppingBag, color: "text-[#6C3FC5]", bg: "bg-purple-50" },
            { label: "Pending Offers", value: pendingOffers, icon: Tag, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Total Sales", value: (walletData as any)?.totalSales || 0, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-50 text-center">
              <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}><stat.icon className={`w-4 h-4 ${stat.color}`} /></div>
              <p className="text-xl font-black text-[#1A0533]">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
          {(["listings", "offers", "sales", "analytics"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === tab ? "bg-white text-[#6C3FC5] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
              {tab}{tab === "offers" && pendingOffers > 0 && <span className="ml-1 bg-[#F5A623] text-white text-xs w-4 h-4 rounded-full inline-flex items-center justify-center font-bold">{pendingOffers}</span>}
            </button>
          ))}
        </div>

        {activeTab === "listings" && (
          <div className="space-y-3">
            {loadingListings ? [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-20" />) :
              myListings && myListings.length > 0 ? myListings.map((listing: any) => (
                <div key={listing.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex gap-3">
                  <div className="w-16 h-16 rounded-xl bg-purple-50 flex-shrink-0 overflow-hidden">
                    {listing.images?.[0] ? <img src={listing.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1A0533] truncate text-sm">{listing.title}</p>
                    <p className="text-base font-black text-[#6C3FC5]">RWF {Number(listing.price).toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${listing.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{listing.status}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-0.5"><Eye className="w-3 h-3" /> {listing.views || 0}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-0.5"><Heart className="w-3 h-3" /> {listing.favoritesCount || 0}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link href={`/marketplace/listing/${listing.id}`}><button className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center hover:bg-purple-100 transition-colors"><Eye className="w-4 h-4 text-[#6C3FC5]" /></button></Link>
                    <button onClick={() => { if (confirm("Delete this listing?")) deleteListing.mutate({ id: listing.id }); }} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"><X className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>
              )) : (
                <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-purple-200">
                  <ShoppingBag className="w-10 h-10 text-purple-200 mx-auto mb-3" />
                  <p className="font-semibold text-gray-600">No listings yet</p>
                  <Link href="/create-listing"><button className="mt-4 bg-gradient-to-r from-[#6C3FC5] to-[#9B6FE8] text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-purple-200">Create First Listing</button></Link>
                </div>
              )}
          </div>
        )}

        {activeTab === "offers" && (
          <div className="space-y-3">
            {loadingOffers ? [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-24" />) :
              myOffers && myOffers.length > 0 ? myOffers.map((offer: any) => (
                <div key={offer.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-[#1A0533] text-sm">{offer.listing?.title || "Listing"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">From: {offer.buyer?.name || "Buyer"}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${offer.status === "pending" ? "bg-amber-100 text-amber-700" : offer.status === "accepted" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{offer.status}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div><p className="text-xs text-gray-400">Listed at</p><p className="font-bold text-gray-600">RWF {Number(offer.listing?.price || 0).toLocaleString()}</p></div>
                    <div className="text-right"><p className="text-xs text-gray-400">Offer</p><p className="font-black text-[#6C3FC5] text-lg">RWF {Number(offer.amount).toLocaleString()}</p></div>
                  </div>
                  {offer.message && <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-2 mb-3 italic">"{offer.message}"</p>}
                  {offer.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => respondOffer.mutate({ offerId: offer.id, action: "accept" })} disabled={respondOffer.isPending} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-emerald-600 transition-colors disabled:opacity-60"><CheckCircle className="w-4 h-4" /> Accept</button>
                      <button onClick={() => respondOffer.mutate({ offerId: offer.id, action: "decline" })} disabled={respondOffer.isPending} className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-500 font-bold py-2.5 rounded-xl text-sm border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-60"><XCircle className="w-4 h-4" /> Decline</button>
                    </div>
                  )}
                </div>
              )) : (
                <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-purple-200">
                  <Tag className="w-10 h-10 text-purple-200 mx-auto mb-3" />
                  <p className="font-semibold text-gray-600">No offers yet</p>
                </div>
              )}
          </div>
        )}

        {activeTab === "sales" && (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-purple-200">
            <BarChart3 className="w-10 h-10 text-purple-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-600">Sales History</p>
            <p className="text-sm text-gray-400 mt-1">Completed sales will appear here</p>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
              <h3 className="font-bold text-[#1A0533] mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#6C3FC5]" /> Performance</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Listing Views", value: myListings?.reduce((sum: number, l: any) => sum + (l.views || 0), 0) || 0, icon: BarChart3 },
                  { label: "Total Favorites", value: myListings?.reduce((sum: number, l: any) => sum + (l.favoritesCount || 0), 0) || 0, icon: Heart },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-xl p-3">
                    <stat.icon className="w-4 h-4 text-[#6C3FC5] mb-1" />
                    <p className="text-xl font-black text-[#1A0533]">{stat.value}</p>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
