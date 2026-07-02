import { Link } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import { formatPrice } from "../lib/api";

export type ListingCardItem = {
  id: number;
  title: string;
  price: string;
  originalPrice?: string | null;
  condition: string;
  images: string[];
  location: string | null;
  isBumped?: boolean;
  likes: number;
  brand?: string | null;
};

type Props = {
  item: ListingCardItem;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  compact?: boolean;
};

export default function ListingCard({ item, isFavorite, onToggleFavorite, compact }: Props) {
  const discount =
    item.originalPrice && Number(item.originalPrice) > Number(item.price)
      ? Math.round((1 - Number(item.price) / Number(item.originalPrice)) * 100)
      : null;

  return (
    <Link
      to={`/client/marketplace/${item.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-purple-100 transition-all duration-200"
    >
      <div className={`relative bg-gradient-to-br from-purple-50 to-violet-50 overflow-hidden ${compact ? "aspect-square" : "aspect-[3/4]"}`}>
        {item.images?.[0] ? (
          <img
            src={item.images[0]}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">✨</div>
        )}
        {item.isBumped && (
          <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-hafi-gold to-amber-400 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
            HOT
          </span>
        )}
        {discount && (
          <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(item.id);
            }}
            className={`absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all ${
              isFavorite ? "bg-red-50 text-red-500" : "bg-white/95 text-gray-400 hover:text-red-400"
            }`}
          >
            <Heart size={18} className={isFavorite ? "fill-current" : ""} />
          </button>
        )}
      </div>
      <div className={compact ? "p-2.5" : "p-3"}>
        {item.brand && <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{item.brand}</p>}
        <p className={`font-semibold line-clamp-2 leading-snug text-gray-800 ${compact ? "text-xs" : "text-sm"}`}>
          {item.title}
        </p>
        <div className="flex items-baseline gap-2 mt-1.5">
          <p className={`font-black text-hafi-purple ${compact ? "text-sm" : "text-base"}`}>
            {formatPrice(item.price)}
          </p>
          {item.originalPrice && Number(item.originalPrice) > Number(item.price) && (
            <p className="text-xs text-gray-400 line-through">{formatPrice(item.originalPrice)}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400">
          <span className="capitalize">{item.condition.replace("_", " ")}</span>
          <span className="flex items-center gap-0.5">
            <Heart size={10} className={item.likes > 0 ? "text-red-300 fill-red-300" : ""} />
            {item.likes}
          </span>
        </div>
        {item.location && (
          <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-1 truncate">
            <MapPin size={10} />
            {item.location}
          </p>
        )}
      </div>
    </Link>
  );
}
