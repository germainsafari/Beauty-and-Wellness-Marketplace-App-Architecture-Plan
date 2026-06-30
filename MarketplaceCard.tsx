// Hafi Marketplace — MarketplaceCard Component
// Design: Velvet Bazaar — bold product cards with shadow, condition badge, gold price, heart pulse

import { useState } from 'react';
import { Heart, Shield, Zap, MapPin } from 'lucide-react';
import { MarketplaceItem, formatPrice, getConditionLabel, getConditionClass } from '@/lib/mockData';

interface MarketplaceCardProps {
  item: MarketplaceItem;
  onClick?: () => void;
  onFavorite?: (id: string) => void;
  variant?: 'masonry' | 'list';
}

export default function MarketplaceCard({ item, onClick, onFavorite, variant = 'masonry' }: MarketplaceCardProps) {
  const [favorited, setFavorited] = useState(item.isFavorited);
  const [heartPulsing, setHeartPulsing] = useState(false);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorited(!favorited);
    setHeartPulsing(true);
    setTimeout(() => setHeartPulsing(false), 400);
    onFavorite?.(item.id);
  };

  if (variant === 'list') {
    return (
      <div
        className="hafi-card flex gap-3 p-3 cursor-pointer"
        onClick={onClick}
      >
        <div className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden">
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          {item.isBumped && (
            <div className="absolute top-1 left-1 bg-amber-400 text-xs font-bold text-gray-900 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Zap size={9} />
              <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '9px' }}>TOP</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {item.title}
            </h3>
            <button onClick={handleFavorite} className="flex-shrink-0 p-1">
              <Heart
                size={18}
                className={`transition-all ${heartPulsing ? 'heart-pulse' : ''} ${favorited ? 'fill-rose-400 text-rose-400' : 'text-gray-300'}`}
              />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getConditionClass(item.condition)}`}>
              {getConditionLabel(item.condition)}
            </span>
            {item.hasBuyerProtection && (
              <Shield size={12} className="text-green-500" />
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="price text-base font-bold text-amber-500">{formatPrice(item.price)}</span>
              {item.originalPrice && (
                <span className="text-xs text-gray-400 line-through ml-1">{formatPrice(item.originalPrice)}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin size={10} />
              <span>{item.distance}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="masonry-item">
      <div
        className="hafi-card overflow-hidden cursor-pointer group"
        onClick={onClick}
      >
        {/* Image */}
        <div className="relative overflow-hidden">
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ aspectRatio: item.id === 'i2' || item.id === 'i7' ? '4/3' : item.id === 'i1' || item.id === 'i5' ? '3/4' : '1/1' }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          {/* Bumped badge */}
          {item.isBumped && (
            <div className="absolute top-2 left-2 bg-amber-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <Zap size={10} />
              <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '10px' }}>FEATURED</span>
            </div>
          )}

          {/* Heart button */}
          <button
            onClick={handleFavorite}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90"
          >
            <Heart
              size={15}
              className={`transition-all duration-200 ${heartPulsing ? 'heart-pulse' : ''} ${favorited ? 'fill-rose-400 text-rose-400' : 'text-gray-400'}`}
            />
          </button>

          {/* Buyer Protection */}
          {item.hasBuyerProtection && (
            <div className="absolute bottom-2 left-2 bg-green-500/90 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <Shield size={9} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 500 }}>Protected</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Condition badge */}
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold mb-1.5 ${getConditionClass(item.condition)}`}
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px' }}>
            {getConditionLabel(item.condition)}
          </span>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-1"
            style={{ fontFamily: 'Poppins, sans-serif' }}>
            {item.title}
          </h3>

          {/* Price row */}
          <div className="flex items-center justify-between">
            <div>
              <span className="price text-base font-bold" style={{ color: '#F5A623' }}>
                {formatPrice(item.price)}
              </span>
              {item.originalPrice && (
                <span className="text-xs text-gray-400 line-through ml-1">
                  {formatPrice(item.originalPrice)}
                </span>
              )}
            </div>
            {item.isNegotiable && (
              <span className="text-xs text-violet-500 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                Negotiable
              </span>
            )}
          </div>

          {/* Location & distance */}
          <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
            <MapPin size={10} />
            <span>{item.distance} · {item.listedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
