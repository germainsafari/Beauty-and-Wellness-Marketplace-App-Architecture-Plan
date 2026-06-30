import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, MessageCircle, Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";

function ConversationList() {
  const [, navigate] = useLocation();
  const { data: conversations, isLoading } = trpc.chat.conversations.useQuery();

  if (isLoading) return (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1"><div className="h-3 bg-gray-100 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
        </div>
      ))}
    </div>
  );

  if (!conversations || conversations.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4"><MessageCircle className="w-8 h-8 text-purple-200" /></div>
      <h3 className="font-bold text-[#1A0533] mb-1">No messages yet</h3>
      <p className="text-sm text-gray-400">Start a conversation by making an offer or contacting a seller</p>
    </div>
  );

  return (
    <div className="divide-y divide-gray-50">
      {conversations.map((conv: any) => {
        const other = conv.otherUser;
        const lastMsg = conv.lastMessage;
        return (
          <button key={conv.id} onClick={() => navigate(`/chat/${conv.id}`)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center font-bold text-[#6C3FC5] text-lg">
                {other?.name?.[0]?.toUpperCase() || "?"}
              </div>
              {conv.unreadCount > 0 && <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#6C3FC5] rounded-full flex items-center justify-center"><span className="text-white text-xs font-bold">{conv.unreadCount}</span></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? "text-[#1A0533]" : "text-gray-700"}`}>{other?.name || "User"}</p>
                <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{lastMsg ? new Date(lastMsg.createdAt).toLocaleDateString() : ""}</p>
              </div>
              <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>{lastMsg?.content || "No messages yet"}</p>
              {conv.type === "listing" && conv.referenceId && <p className="text-xs text-[#6C3FC5] mt-0.5 truncate">📦 Listing #{conv.referenceId}</p>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MessageThread({ conversationId }: { conversationId: number }) {
  const [, navigate] = useLocation();
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: messages, isLoading, refetch } = trpc.chat.messages.useQuery({ conversationId });
  const { data: convos } = trpc.chat.conversations.useQuery();
  const convData = convos?.find((c: any) => c.id === conversationId) as any;
  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: () => { setMessage(""); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <button onClick={() => navigate("/chat")} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><ArrowLeft className="w-4 h-4 text-gray-600" /></button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center font-bold text-[#6C3FC5]">
          {convData?.otherUser?.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[#1A0533] text-sm">{convData?.otherUser?.name || "User"}</p>
          {convData?.type === "listing" && convData?.referenceId && <p className="text-xs text-[#6C3FC5] truncate">📦 Listing #{convData.referenceId}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-[#6C3FC5] animate-spin" /></div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg: any) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-gradient-to-br from-[#6C3FC5] to-[#9B6FE8] text-white rounded-br-sm" : "bg-white text-gray-800 shadow-sm rounded-bl-sm"}`}>
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMe ? "text-purple-200" : "text-gray-400"}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10"><p className="text-sm text-gray-400">No messages yet. Say hello!</p></div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey && message.trim()) { e.preventDefault(); sendMessage.mutate({ conversationId, body: message.trim() }); } }}
            placeholder="Type a message..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C3FC5]"
          />
          <button
            onClick={() => { if (message.trim()) sendMessage.mutate({ conversationId, body: message.trim() }); }}
            disabled={!message.trim() || sendMessage.isPending}
            className="w-10 h-10 bg-gradient-to-br from-[#6C3FC5] to-[#9B6FE8] rounded-xl flex items-center justify-center shadow-md shadow-purple-200 disabled:opacity-40 hover:scale-105 active:scale-95 transition-all"
          >
            {sendMessage.isPending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { isAuthenticated } = useAuth();
  const params = useParams<{ id?: string }>();
  const conversationId = params.id ? Number(params.id) : undefined;

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-2xl font-black text-[#1A0533] mb-2">Messages</h2>
          <p className="text-gray-400 mb-6">Sign in to chat with sellers and buyers</p>
          <a href={getLoginUrl()}><button className="bg-gradient-to-r from-[#6C3FC5] to-[#9B6FE8] text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-purple-200">Sign In</button></a>
        </div>
      </AppLayout>
    );
  }

  if (conversationId) {
    return <AppLayout hideNav><MessageThread conversationId={conversationId} /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-2xl font-black text-[#1A0533]">Messages</h1>
          <p className="text-gray-400 text-sm">Chat with buyers and sellers</p>
        </div>
        <ConversationList />
      </div>
    </AppLayout>
  );
}
