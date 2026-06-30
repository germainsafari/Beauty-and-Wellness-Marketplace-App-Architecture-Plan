// Hafi Marketplace — ItemDetail Screen
// Design: Velvet Bazaar — full product detail, image carousel, offer flow, escrow badge

import { useState } from 'react';
import {
  ArrowLeft, Heart, Share2, Shield, Package, Truck, Clock,
  Star, MapPin, Eye, ChevronLeft, ChevronRight, MessageCircle,
  Zap, Flag, CheckCircle
} from 'lucide-react';
import OfferBottomSheet from '@/components/OfferBottomSheet';
import SellerProfile from '@/components/SellerProfile';
import { MarketplaceItem, formatPrice, getConditionLabel, getConditionClass } from '@/lib/mockData';
import { toast } from 'sonner';

interface ItemDetailProps {
  item: MarketplaceItem;
  onBack: () => void;
}

export default function ItemDetail({ item, onBack }: ItemDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [favorited, setFavorited] = useState(item.isFavorited);
  const [showOfferSheet, setShowOfferSheet] = useState(false);
  const [heartPulsing, setHeartPulsing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleFavorite = () => {
    setFavorited(!favorited);
    setHeartPulsing(true);
    setTimeout(() => setHeartPulsing(false), 400);
    if (!favorited) {
      toast.success('Added to your wishlist! 💜', {
        style: { background: '#6C3FC5', color: 'white', border: 'none' },
      });
    }
  };

  const handleBuyNow = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
    toast.success('Redirecting to secure checkout...', {
      style: { background: 'linear-gradient(135deg, #6C3FC5, #8B5CF6)', color: 'white', border: 'none' },
    });
  };

  const handleShare = () => {
    toast.success('Link copied! Share on WhatsApp or Instagram 📱', {
      style: { background: '#25D366', color: 'white', border: 'none' },
    });
  };

  const handleReport = () => {
    toast.error('Report submitted. Our team will review this listing.', {
      style: { background: '#E74C3C', color: 'white', border: 'none' },
    });
  };

  return (
    <div className="min-h-screen bg-white" style={{ paddingBottom: '100px' }}>
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="confetti-particle absolute w-3 h-3 rounded-sm"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                background: ['#6C3FC5', '#F5A623', '#FF7EB3', '#2ECC71'][i % 4],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.6 + Math.random() * 0.6}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Image carousel */}
      <div className="relative bg-gray-100" style={{ height: '360px' }}>
        <img
          src={item.images[currentImageIndex]}
          alt={item.title}
          className="w-full h-full object-cover"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md active:scale-90 transition-transform"
          >
            <ArrowLeft size={18} className="text-gray-800" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md active:scale-90 transition-transform"
            >
              <Share2 size={16} className="text-gray-800" />
            </button>
            <button
              onClick={handleFavorite}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md active:scale-90 transition-transform"
            >
              <Heart
                size={18}
                className={`transition-all ${heartPulsing ? 'heart-pulse' : ''} ${favorited ? 'fill-rose-400 text-rose-400' : 'text-gray-600'}`}
              />
            </button>
          </div>
        </div>

        {/* Image navigation */}
        {item.images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow"
              disabled={currentImageIndex === 0}
            >
              <ChevronLeft size={18} className="text-gray-700" />
            </button>
            <button
              onClick={() => setCurrentImageIndex(Math.min(item.images.length - 1, currentImageIndex + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow"
              disabled={currentImageIndex === item.images.length - 1}
            >
              <ChevronRight size={18} className="text-gray-700" />
            </button>
          </>
        )}

        {/* Image dots */}
        {item.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {item.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === currentImageIndex ? '20px' : '6px',
                  height: '6px',
                  background: i === currentImageIndex ? '#F5A623' : 'rgba(255,255,255,0.6)',
                }}
              />
            ))}
          </div>
        )}

        {/* Bumped badge */}
        {item.isBumped && (
          <div className="absolute top-16 left-4 bg-amber-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow">
            <Zap size={11} />
            <span style={{ fontFamily: 'Poppins, sans-serif' }}>FEATURED LISTING</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pt-5 space-y-5">
        {/* Title & price */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-bold text-xl text-gray-900 leading-tight flex-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {item.title}
            </h1>
            <div className="text-right flex-shrink-0">
              <p className="price text-2xl font-bold" style={{ color: '#F5A623' }}>
                {formatPrice(item.price)}
              </p>
              {item.originalPrice && (
                <p className="text-sm text-gray-400 line-through" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatPrice(item.originalPrice)}
                </p>
              )}
              {item.isNegotiable && (
                <p className="text-xs font-medium text-violet-500 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Negotiable
                </p>
              )}
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex items-center flex-wrap gap-2 mt-3">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getConditionClass(item.condition)}`}>
              {getConditionLabel(item.condition)}
            </span>
            {item.brand && (
              <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}>
                {item.brand}
              </span>
            )}
            <span className="text-xs text-gray-400 flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              <Eye size={11} />
              {item.views} views
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              <Heart size={11} />
              {item.likes} likes
            </span>
          </div>
        </div>

        {/* Buyer Protection Banner */}
        {item.hasBuyerProtection && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl p-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-green-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Buyer Protection Included
              </p>
              <p className="text-xs text-green-600 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                Funds held in escrow · 48h dispute window · Full refund if item not as described
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <h3 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '15px' }}>
            Description
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            {item.description}
          </p>
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.tags.map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}>
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
          <MapPin size={14} style={{ color: '#6C3FC5' }} />
          <span>{item.location} · {item.distance} away · Listed {item.listedAt}</span>
        </div>

        {/* Shipping options */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '15px' }}>
            Shipping Options
          </h3>
          <div className="space-y-2">
            {item.shipping.map((opt, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2">
                  <Truck size={14} style={{ color: '#6C3FC5' }} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {opt.method}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <Clock size={10} />
                      {opt.days}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif', color: opt.price === 0 ? '#2ECC71' : '#1A1A2E' }}>
                  {opt.price === 0 ? 'FREE' : formatPrice(opt.price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Escrow info */}
        <div className="bg-violet-50 rounded-2xl p-4">
          <h3 className="font-bold text-violet-800 mb-2 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>
            <Shield size={14} />
            How Payment Works
          </h3>
          <div className="space-y-2">
            {[
              { step: '1', text: 'You pay via MTN MoMo, Airtel Money, or card' },
              { step: '2', text: 'Funds held securely in escrow by Hafi' },
              { step: '3', text: 'Seller ships your item within 2 days' },
              { step: '4', text: 'You confirm receipt — funds released to seller' },
              { step: '5', text: '48h window to raise a dispute if needed' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: '#6C3FC5', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {step}
                </span>
                <p className="text-xs text-violet-700" style={{ fontFamily: 'Inter, sans-serif' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Seller */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '15px' }}>
            Seller
          </h3>
          <SellerProfile seller={item.seller} compact />
        </div>

        {/* Report */}
        <button
          onClick={handleReport}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <Flag size={12} />
          Report this listing
        </button>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-100"
        style={{ maxWidth: '430px', margin: '0 auto', boxShadow: '0 -4px 20px rgba(108, 63, 197, 0.08)' }}>
        <div className="flex gap-3">
          {item.isNegotiable && (
            <button
              onClick={() => setShowOfferSheet(true)}
              className="flex-1 py-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ borderColor: '#6C3FC5', color: '#6C3FC5', fontFamily: 'Poppins, sans-serif' }}
            >
              <MessageCircle size={16} />
              Make Offer
            </button>
          )}
          <button
            onClick={handleBuyNow}
            className="hafi-btn-gold font-bold text-sm py-4 flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ flex: item.isNegotiable ? 1.5 : 1 }}
          >
            <CheckCircle size={16} />
            Buy Now · {formatPrice(item.price)}
          </button>
        </div>
      </div>

      <OfferBottomSheet
        isOpen={showOfferSheet}
        onClose={() => setShowOfferSheet(false)}
        item={item}
        mode="make"
      />
    </div>
  );
}
