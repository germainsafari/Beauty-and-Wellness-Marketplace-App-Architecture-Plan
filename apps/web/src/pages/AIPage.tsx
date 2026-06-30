import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import { trpcCall } from "../lib/api";

type AiMessage = { id: number; role: string; content: string };

const PROMPTS = [
  "Best skincare routine for oily skin?",
  "Find braiding salons near Kigali",
  "What pre-loved makeup deals are trending?",
];

export default function AIPage() {
  const { user } = useApp();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const sessions = await trpcCall<{ id: number }[]>("ai.sessions");
        const session = sessions[0] ?? await trpcCall<{ id: number }>("ai.createSession", {}, "mutation");
        setSessionId(session.id);
        setMessages(await trpcCall<AiMessage[]>("ai.messages", { sessionId: session.id }));
      } catch {
        /* offline */
      }
    })();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || !sessionId || sending) return;
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: msg }]);
    try {
      const { reply } = await trpcCall<{ reply: string }>("ai.chat", { sessionId, message: msg }, "mutation");
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", content: e instanceof Error ? e.message : "AI unavailable" }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="bg-gradient-to-r from-hafi-dark to-hafi-mid text-white p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Sparkles className="w-5 h-5" /></div>
          <div>
            <h1 className="font-black font-display">Hafi AI</h1>
            <p className="text-purple-200 text-xs">Your beauty concierge 💜</p>
          </div>
        </div>
        <p className="text-sm text-purple-100">Hey {user?.name?.split(" ")[0]}! How can I help you glow today?</p>
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 p-4">
          {PROMPTS.map((p) => (
            <button key={p} onClick={() => send(p)} className="text-xs bg-white border border-purple-100 text-hafi-purple font-semibold px-3 py-2 rounded-full hover:bg-purple-50">{p}</button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "ml-auto bg-hafi-purple text-white" : "bg-white shadow-sm"}`}>
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t border-purple-100 flex gap-2">
        <input
          className="flex-1 bg-hafi-bg rounded-2xl px-4 py-3 text-sm outline-none"
          placeholder="Ask about beauty, bookings, marketplace..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
        />
        <button onClick={() => send()} disabled={sending} className="w-12 h-12 bg-hafi-purple text-white rounded-full flex items-center justify-center disabled:opacity-50">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
