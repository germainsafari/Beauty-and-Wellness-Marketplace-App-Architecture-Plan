import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Search, Send } from "lucide-react";
import { useApp } from "../context/AppContext";
import { trpcCall } from "../lib/api";
import { getSocket } from "../lib/socket";

type Conversation = {
  id: number;
  otherUser: { id: number; name: string; avatarUrl: string | null } | null;
  lastMessage: { body: string | null; createdAt: string } | null;
  unreadCount: number;
};

type ChatMessage = {
  id: number;
  conversationId: number;
  senderId: number;
  body: string | null;
  createdAt: string;
};

export default function ChatPanel({ title = "Messages" }: { title?: string }) {
  const { user } = useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(() => {
    trpcCall<Conversation[]>("chat.conversations")
      .then((rows) => {
        setConversations(rows);
        if (!selectedId && rows[0]) setSelectedId(rows[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    trpcCall<ChatMessage[]>("chat.messages", { conversationId: selectedId })
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [selectedId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedId) return;
    socket.emit("chat:join", selectedId);

    const onMessage = (message: ChatMessage) => {
      if (message.conversationId !== selectedId) return;
      setMessages((current) => (current.some((m) => m.id === message.id) ? current : [...current, message]));
      loadConversations();
    };
    const onTyping = (event: { conversationId: number; userId: number }) => {
      if (event.conversationId === selectedId && event.userId !== user?.id) {
        setTyping(true);
        window.setTimeout(() => setTyping(false), 1200);
      }
    };
    socket.on("chat:message", onMessage);
    socket.on("chat:typing", onTyping);
    return () => {
      socket.off("chat:message", onMessage);
      socket.off("chat:typing", onTyping);
    };
  }, [loadConversations, selectedId, user?.id]);

  const send = async () => {
    if (!selectedId || !draft.trim()) return;
    setSending(true);
    try {
      await trpcCall("chat.send", { conversationId: selectedId, body: draft.trim() }, "mutation");
      setDraft("");
      const updated = await trpcCall<ChatMessage[]>("chat.messages", { conversationId: selectedId });
      setMessages(updated);
      loadConversations();
    } finally {
      setSending(false);
    }
  };

  const selected = conversations.find((c) => c.id === selectedId);
  const socket = getSocket();
  const filteredConversations = conversations.filter((c) =>
    `${c.otherUser?.name ?? ""} ${c.lastMessage?.body ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black font-display tracking-tight">{title}</h1>
          <p className="text-gray-500">Fast, trusted conversations for bookings, jobs, quotes, offers, and orders.</p>
        </div>
        <div className={`text-xs font-black px-3 py-2 rounded-full w-fit ${socket?.connected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {socket?.connected ? "Realtime online" : "Reconnecting"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 min-h-[640px]">
        <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 border px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations"
                className="bg-transparent outline-none text-sm flex-1"
              />
            </div>
          </div>
          {loading ? (
            <p className="p-6 text-gray-400 text-sm">Loading conversations...</p>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-10 h-10 mx-auto text-purple-200 mb-3" />
              <p className="text-gray-500 text-sm">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                  selectedId === c.id ? "bg-[#F3F0FF]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-hafi-dark text-white grid place-items-center font-black">
                    {(c.otherUser?.name ?? "U")[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start gap-3">
                      <p className="font-black text-sm truncate">{c.otherUser?.name ?? "User"}</p>
                      {c.unreadCount > 0 && (
                        <span className="bg-hafi-purple text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{c.lastMessage?.body ?? "No messages"}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="bg-white rounded-2xl border flex flex-col shadow-sm overflow-hidden">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm gap-3">
              <MessageCircle className="text-purple-200" size={48} />
              <p>Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-hafi-purple text-white grid place-items-center font-black">
                  {(selected?.otherUser?.name ?? "U")[0]}
                </div>
                <div>
                  <p className="font-black">{selected?.otherUser?.name}</p>
                  <p className="text-xs text-gray-400">Protected Hafi conversation</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[430px] bg-[#FAFAF8]">
                {messages.map((m) => {
                  const mine = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-3xl px-4 py-3 text-sm shadow-sm ${mine ? "bg-hafi-purple text-white rounded-br-md" : "bg-white text-gray-800 rounded-bl-md border"}`}>
                        <p>{m.body}</p>
                        <p className={`text-[10px] mt-1 ${mine ? "text-white/60" : "text-gray-400"}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {typing && <p className="text-xs text-gray-400">Typing...</p>}
              </div>
              <div className="p-4 border-t flex gap-2 bg-white">
                <input
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    getSocket()?.emit("chat:typing", selectedId);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-hafi-purple/20"
                />
                <button onClick={send} disabled={sending || !draft.trim()} className="bg-hafi-purple text-white px-4 rounded-2xl disabled:opacity-50">
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
