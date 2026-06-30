// Hafi Marketplace — SellerProfilePage Screen
// Design: Velvet Bazaar — full seller profile, listings grid, reviews, trust signals

import { useState } from 'react';
import { ArrowLeft, MessageCircle, Flag, Star, Shield, Package, Clock, CheckCircle } from 'lucide-react';
import MarketplaceCard from '@/components/MarketplaceCard';
import SellerProfile from '@/components/SellerProfile';
import { MOCK_SELLERS, MOCK_ITEMS, MarketplaceItem } from '@/lib/mockData';
import { toast } from 'sonner';

interface SellerProfilePageProps {
  sellerId: string;
  onBack: () => void;
  onItemClick: (item: MarketplaceItem) => void;
}

const MOCK_REVIEWS = [
  {
    id: 'r1',
    reviewer: 'Claudine M.',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&q=80',
    rating: 5,
    text: 'Amazing seller! Item was exactly as described. Fast shipping and beautiful packaging. Will definitely buy again! 💜',
    date: '3 days ago',
    item: 'Charlotte Tilbury Lipstick',
  },
  {
    id: 'r2',
    reviewer: 'Patrick N.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80',
    rating: 5,
    text: 'Very responsive seller. The Dyson Airwrap was in perfect condition. Great deal!',
    date: '1 week ago',
    item: 'Dyson Airwrap',
  },
  {
    id: 'r3',
    reviewer: 'Aline K.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&q=80',
    rating: 4,
    text: 'Good seller, item was as described. Shipping took a bit longer than expected but overall happy.',
    date: '2 weeks ago',
    item: 'Chanel No.5',
  },
];

export default function SellerProfilePage({ sellerId, onBack, onItemClick }: SellerProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');
  const seller = MOCK_SELLERS.find(s => s.id === sellerId) || MOCK_SELLERS[0];
  const sellerListings = MOCK_ITEMS.filter(i => i.seller.id === sellerId).slice(0, 6);

  const handleMessage = () => {
    toast.success('Opening chat with ' + seller.name, {
      style: { background: '#6C3FC5', color: 'white', border: 'none' },
    });
  };

  const handleReport = () => {
    toast.error('Report submitted. Our team will review this profile.', {
      style: { background: '#E74C3C', color: 'white', border: 'none' },
    });
  };

  return (
    <div className="min-h-screen" style={{ background: '#FAF9FF', paddingBottom: '80px' }}>
      {/* Back button overlay */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md active:scale-90 transition-transform"
        >
          <ArrowLeft size={18} className="text-gray-800" />
        </button>
      </div>

      {/* Seller profile card */}
      <div className="px-4 pt-4">
        <SellerProfile seller={seller} compact={false} />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-4 mt-4">
        <button
          onClick={handleMessage}
          className="hafi-btn-primary flex-1 py-3.5 font-bold text-sm flex items-center justify-center gap-2"
        >
          <MessageCircle size={16} />
          Message Seller
        </button>
        <button
          onClick={handleReport}
          className="w-12 h-12 rounded-2xl border border-gray-200 flex items-center justify-center active:scale-90 transition-transform"
        >
          <Flag size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Trust signals */}
      <div className="mx-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { icon: Shield, label: 'ID Verified', color: '#F5A623', active: seller.isVerified },
          { icon: CheckCircle, label: 'Pro Seller', color: '#6C3FC5', active: seller.isProvider },
          { icon: Clock, label: 'Fast Reply', color: '#2ECC71', active: true },
        ].map(trust => (
          <div
            key={trust.label}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border"
            style={{
              borderColor: trust.active ? `${trust.color}30` : '#E8E0FF',
              background: trust.active ? `${trust.color}10` : '#F9F9F9',
            }}
          >
            <trust.icon size={18} style={{ color: trust.active ? trust.color : '#D1D5DB' }} />
            <span className="text-xs font-medium text-center" style={{
              fontFamily: 'Inter, sans-serif',
              color: trust.active ? trust.color : '#9CA3AF',
            }}>
              {trust.label}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mt-5 bg-gray-100 rounded-xl p-1">
        {[
          { id: 'listings', label: `Listings (${sellerListings.length})` },
          { id: 'reviews', label: `Reviews (${seller.reviewCount})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{
              fontFamily: 'Poppins, sans-serif',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#6C3FC5' : '#9CA3AF',
              boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">
        {activeTab === 'listings' && (
          sellerListings.length > 0 ? (
            <div className="masonry-grid">
              {sellerListings.map(item => (
                <MarketplaceCard key={item.id} item={item} variant="masonry" onClick={() => onItemClick(item)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                No active listings
              </p>
            </div>
          )
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {/* Rating summary */}
            <div className="hafi-card p-4 flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#F5A623' }}>
                  {seller.rating}
                </p>
                <div className="flex gap-0.5 mt-1 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className={i < Math.floor(seller.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {seller.reviewCount} reviews
                </p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map(star => {
                  const pct = star === 5 ? 78 : star === 4 ? 15 : star === 3 ? 5 : star === 2 ? 1 : 1;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{star}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#F5A623' }} />
                      </div>
                      <span className="text-xs text-gray-400 w-6 text-right" style={{ fontFamily: 'Inter, sans-serif' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review cards */}
            {MOCK_REVIEWS.map(review => (
              <div key={review.id} className="hafi-card p-4">
                <div className="flex items-start gap-3">
                  <img src={review.avatar} alt={review.reviewer} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {review.reviewer}
                      </p>
                      <span className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {review.date}
                      </span>
                    </div>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {review.text}
                    </p>
                    <p className="text-xs text-violet-500 mt-1.5 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Re: {review.item}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
