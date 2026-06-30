import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import {
  AlertTriangle, BarChart3, CheckCircle, Flag, Loader2,
  ShieldCheck, ShoppingBag, TrendingUp, Users, XCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "listings" | "reports">("overview");

  const { data: stats, isLoading: loadingStats } = trpc.admin.stats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const { data: allUsers, isLoading: loadingUsers } = trpc.admin.users.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin" && activeTab === "users",
  });
  const { data: allListings, isLoading: loadingListings } = trpc.listings.list.useQuery({ limit: 50 }, {
    enabled: isAuthenticated && user?.role === "admin" && activeTab === "listings",
  });
  const { data: reports, isLoading: loadingReports } = trpc.admin.reports.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin" && activeTab === "reports",
  });

  const utils = trpc.useUtils();
  const resolveReport = trpc.admin.resolveReport.useMutation({
    onSuccess: () => { toast.success("Report resolved"); utils.admin.reports.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <ShieldCheck className="w-16 h-16 text-purple-200 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-[#1A0533] mb-2">Admin Panel</h2>
          <p className="text-gray-400">Sign in with an admin account to access this area.</p>
        </div>
      </AppLayout>
    );
  }

  if (user?.role !== "admin") {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-[#1A0533] mb-2">Access Denied</h2>
          <p className="text-gray-400">You need admin privileges to view this page.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gradient-to-br from-[#6C3FC5] to-[#9B6FE8] rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1A0533]">Admin Panel</h1>
            <p className="text-gray-400 text-sm">Platform management &amp; moderation</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 overflow-x-auto">
          {(["overview", "users", "listings", "reports"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                activeTab === tab ? "bg-white text-[#6C3FC5] shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {loadingStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-24" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total Users", value: (stats as any)?.totalUsers || 0, icon: Users, color: "text-[#6C3FC5]", bg: "bg-purple-50" },
                    { label: "Active Listings", value: (stats as any)?.activeListings || 0, icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Total Bookings", value: (stats as any)?.totalBookings || 0, icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Open Reports", value: (stats as any)?.openReports || 0, icon: Flag, color: "text-red-500", bg: "bg-red-50" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                      <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <p className="text-2xl font-black text-[#1A0533]">{stat.value.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Revenue Card */}
                <div className="bg-gradient-to-br from-[#6C3FC5] to-[#9B6FE8] rounded-2xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-200" />
                    <p className="font-semibold text-purple-200 text-sm">Platform Revenue (Commission)</p>
                  </div>
                  <p className="text-3xl font-black">RWF {Number((stats as any)?.totalRevenue || 0).toLocaleString()}</p>
                  <p className="text-purple-300 text-xs mt-1">Across all completed transactions</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <div className="space-y-2">
            {loadingUsers ? (
              [...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-16" />)
            ) : allUsers && (allUsers as any[]).length > 0 ? (
              (allUsers as any[]).map((u: any) => (
                <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#6C3FC5] to-[#9B6FE8] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{(u.name?.[0] || "U").toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1A0533] text-sm truncate">{u.name || "Unknown"}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email || u.openId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      u.role === "admin" ? "bg-purple-100 text-[#6C3FC5]" : "bg-gray-100 text-gray-500"
                    }`}>{u.role}</span>
                    <p className="text-xs text-gray-300">{new Date(u.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-purple-200">
                <Users className="w-10 h-10 text-purple-200 mx-auto mb-3" />
                <p className="font-semibold text-gray-600">No users found</p>
              </div>
            )}
          </div>
        )}

        {/* Listings */}
        {activeTab === "listings" && (
          <div className="space-y-2">
            {loadingListings ? (
              [...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-20" />)
            ) : allListings && (allListings as any[]).length > 0 ? (
              (allListings as any[]).map((listing: any) => (
                <div key={listing.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-3">
                  <div className="w-14 h-14 bg-purple-50 rounded-xl flex-shrink-0 overflow-hidden">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1A0533] text-sm truncate">{listing.title}</p>
                    <p className="text-xs text-gray-400">RWF {Number(listing.price).toLocaleString()} · {listing.condition}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    listing.status === "active" ? "bg-emerald-100 text-emerald-700" :
                    listing.status === "sold" ? "bg-blue-100 text-blue-600" :
                    "bg-gray-100 text-gray-500"
                  }`}>{listing.status}</span>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-purple-200">
                <ShoppingBag className="w-10 h-10 text-purple-200 mx-auto mb-3" />
                <p className="font-semibold text-gray-600">No listings found</p>
              </div>
            )}
          </div>
        )}

        {/* Reports */}
        {activeTab === "reports" && (
          <div className="space-y-3">
            {loadingReports ? (
              [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-28" />)
            ) : reports && (reports as any[]).length > 0 ? (
              (reports as any[]).map((report: any) => (
                <div key={report.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-red-400" />
                      <p className="font-semibold text-[#1A0533] text-sm">Report #{report.id}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      report.status === "open" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
                    }`}>{report.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-2 mb-3">{report.reason}</p>
                  {report.status === "open" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => resolveReport.mutate({ id: report.id, status: "dismissed" })}
                        disabled={resolveReport.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-600 font-bold py-2 rounded-xl text-xs hover:bg-gray-200 transition-colors disabled:opacity-60"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Dismiss
                      </button>
                      <button
                        onClick={() => resolveReport.mutate({ id: report.id, status: "resolved" })}
                        disabled={resolveReport.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-500 font-bold py-2 rounded-xl text-xs border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-60"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Remove Content
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-purple-200">
                <Flag className="w-10 h-10 text-purple-200 mx-auto mb-3" />
                <p className="font-semibold text-gray-600">No open reports</p>
                <p className="text-xs text-gray-400 mt-1">The platform is clean!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
