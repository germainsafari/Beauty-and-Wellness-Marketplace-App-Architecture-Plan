import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Bell, Check, Loader2, ShoppingBag, Star, Tag } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";

const ICON_MAP: Record<string, any> = {
  new_offer: Tag, offer_accepted: Check, offer_declined: Tag,
  new_order: ShoppingBag, new_review: Star, default: Bell,
};

export default function Notifications() {
  const { isAuthenticated } = useAuth();
  const { data: notifs, isLoading, refetch } = trpc.notifications.mine.useQuery(undefined, { enabled: isAuthenticated });
  const markRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => refetch() });

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h2 className="text-2xl font-black text-[#1A0533] mb-2">Notifications</h2>
          <p className="text-gray-400 mb-6">Sign in to see your notifications</p>
          <a href={getLoginUrl()}><button className="bg-gradient-to-r from-[#6C3FC5] to-[#9B6FE8] text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-purple-200">Sign In</button></a>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-5">
          <div><h1 className="text-2xl font-black text-[#1A0533]">Notifications</h1><p className="text-gray-400 text-sm">Stay up to date</p></div>
          {notifs && notifs.some((n: any) => !n.isRead) && (
            <button onClick={() => markRead.mutate()} className="text-sm text-[#6C3FC5] font-semibold hover:underline">Mark all read</button>
          )}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-[#6C3FC5] animate-spin" /></div>
        ) : notifs && notifs.length > 0 ? (
          <div className="space-y-2">
            {notifs.map((notif: any) => {
              const Icon = ICON_MAP[notif.type] || ICON_MAP.default;
              return (
                <div key={notif.id} className={`flex gap-3 p-4 rounded-2xl transition-colors ${notif.isRead ? "bg-white border border-gray-50" : "bg-purple-50 border border-purple-100"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.isRead ? "bg-gray-100" : "bg-[#6C3FC5]"}`}>
                    <Icon className={`w-5 h-5 ${notif.isRead ? "text-gray-400" : "text-white"}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${notif.isRead ? "text-gray-700" : "text-[#1A0533]"}`}>{notif.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{notif.body}</p>
                    <p className="text-xs text-gray-300 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                  </div>
                  {!notif.isRead && <div className="w-2 h-2 rounded-full bg-[#6C3FC5] mt-2 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4"><Bell className="w-8 h-8 text-purple-200" /></div>
            <h3 className="font-bold text-[#1A0533] mb-1">All caught up!</h3>
            <p className="text-sm text-gray-400">No new notifications</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
