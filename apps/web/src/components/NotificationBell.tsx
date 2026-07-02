import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { trpcCall } from "../lib/api";

type Notification = {
  id: number;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = () => {
    trpcCall<Notification[]>("notifications.mine").then(setNotifications).catch(() => {});
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const unread = notifications.filter((n) => !n.isRead).length;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await trpcCall("notifications.markAllRead", undefined, "mutation").catch(() => {});
      load();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative w-10 h-10 rounded-xl border bg-white flex items-center justify-center hover:bg-gray-50"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black grid place-items-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] bg-white border rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b">
            <p className="font-black">Notifications</p>
            <p className="text-xs text-gray-400">Bookings, messages, offers, payments</p>
          </div>
          <div className="max-h-96 overflow-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-400">No notifications yet.</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div key={n.id} className="p-4 border-b last:border-b-0">
                  <p className="text-sm font-black">{n.title}</p>
                  {n.body && <p className="text-xs text-gray-500 mt-1">{n.body}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
