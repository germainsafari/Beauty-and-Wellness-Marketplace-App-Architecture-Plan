import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { trpcCall } from "../../lib/api";
import { useApp } from "../../context/AppContext";

type Conversation = {
  id: number;
  otherUser: { id: number; name: string; avatarUrl: string | null } | null;
  lastMessage: { body: string | null; createdAt: string } | null;
  unreadCount: number;
};

type ChatMessage = {
  id: number;
  senderId: number;
  body: string | null;
  createdAt: string;
};

export default function MerchantMessagesPage() {
  const { user } = useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(() => {
    trpcCall<Conversation[]>("chat.conversations")
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    trpcCall<ChatMessage[]>("chat.messages", { conversationId: selectedId })
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [selectedId]);

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

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black font-display">Messages</h1>
      <p className="text-gray-500">Client & buyer conversations</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[480px]">
        <div className="bg-white rounded-2xl border overflow-hidden lg:col-span-1">
          {loading ? (
            <p className="p-6 text-gray-400 text-sm">Loading...</p>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-10 h-10 mx-auto text-purple-200 mb-3" />
              <p className="text-gray-500 text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left p-4 border-b hover:bg-purple-50 transition-colors ${
                  selectedId === c.id ? "bg-purple-50" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-bold text-sm">{c.otherUser?.name ?? "User"}</p>
                  {c.unreadCount > 0 && (
                    <span className="bg-hafi-purple text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {c.lastMessage?.body ?? "No messages"}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="bg-white rounded-2xl border flex flex-col lg:col-span-2">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="p-4 border-b font-bold">{selected?.otherUser?.name}</div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[320px]">
                {messages.map((m) => {
                  const mine = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                          mine ? "bg-hafi-purple text-white" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {m.body}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-xl px-4 py-2 text-sm"
                />
                <button
                  onClick={send}
                  disabled={sending || !draft.trim()}
                  className="bg-hafi-purple text-white p-2.5 rounded-xl disabled:opacity-50"
                >
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
