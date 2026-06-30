import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import { trpcCall } from "../lib/api";

export default function SellPage() {
  const { user } = useApp();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<"new" | "like_new" | "good" | "fair">("good");
  const [msg, setMsg] = useState("");

  const publish = async () => {
    try {
      await trpcCall("listings.create", {
        title,
        description,
        price: Number(price),
        condition,
        location: user?.location || "Kigali",
        isNegotiable: true,
        images: ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80"],
        tags: ["beauty"],
      }, "mutation");
      setMsg("Listed! 🎉 Your item is live.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="p-4 pb-24">
      <Link to="/" className="inline-flex items-center gap-2 text-hafi-purple mb-4"><ArrowLeft className="w-4 h-4" /> Home</Link>
      <h1 className="text-2xl font-black font-display mb-1">Sell on Hafi</h1>
      <p className="text-gray-400 text-sm mb-6">List your pre-loved beauty gems ✨</p>

      <div className="space-y-4">
        <input className="w-full bg-white rounded-xl px-4 py-3" placeholder="Title *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="w-full bg-white rounded-xl px-4 py-3" placeholder="Price (RWF) *" value={price} onChange={(e) => setPrice(e.target.value)} type="number" />
        <div className="flex flex-wrap gap-2">
          {(["new", "like_new", "good", "fair"] as const).map((c) => (
            <button key={c} onClick={() => setCondition(c)} className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${condition === c ? "bg-hafi-purple text-white" : "bg-white text-gray-600"}`}>{c.replace("_", " ")}</button>
          ))}
        </div>
        <textarea className="w-full bg-white rounded-xl px-4 py-3 min-h-24" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        {msg && <p className="text-emerald-600 font-semibold text-sm">{msg}</p>}
        <button onClick={publish} className="w-full bg-gradient-to-r from-hafi-purple to-hafi-light text-white font-bold py-4 rounded-2xl">Publish Listing</button>
      </div>
    </div>
  );
}
