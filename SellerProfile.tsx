// Hafi Marketplace — SellerProfile Component
// Design: Velvet Bazaar — cover photo, avatar, verified badge, stats row

import { Star, Shield, Clock, Package, MapPin, ChevronRight } from 'lucide-react';
import { Seller } from '@/lib/mockData';

interface SellerProfileProps {
  seller: Seller;
  compact?: boolean;
  onClick?: () => void;
}

export default function SellerProfile({ seller, compact = false, onClick }: SellerProfileProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onClick}>
        <div className="relative flex-shrink-0">
          <img
            src={seller.avatar}
            alt={seller.name}
            className="w-11 h-11 rounded-full object-cover border-2"
            style={{ borderColor: seller.isVerified ? '#F5A623' : '#E8E0FF' }}
          />
          {seller.isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center verified-glow">
              <Shield size={10} className="text-white" fill="white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-gray-900 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {seller.name}
            </span>
            {seller.isProvider && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: 'linear-gradient(135deg, #6C3FC5, #8B5CF6)', color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '9px' }}>
                PRO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-0.5">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-gray-700" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {seller.rating}
              </span>
              <span className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                ({seller.reviewCount})
              </span>
            </div>
            <span className="text-gray-300">·</span>
            <div className="flex items-center gap-0.5 text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              <Clock size={10} />
              <span>{seller.responseTime}</span>
            </div>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-violet-400 transition-colors" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(108, 63, 197, 0.10)' }}>
      {/* Cover photo */}
      <div
        className="h-28 relative"
        style={{
          background: 'linear-gradient(135deg, #6C3FC5 0%, #8B5CF6 50%, #FF7EB3 100%)',
          backgroundImage: `url(/manus-storage/hafi-seller-profile-bg_2d11934d.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
      </div>

      {/* Avatar & info */}
      <div className="px-5 pb-4">
        <div className="flex items-end justify-between -mt-8 mb-3">
          <div className="relative">
            <img
              src={seller.avatar}
              alt={seller.name}
              className="w-20 h-20 rounded-2xl object-cover border-4 border-white"
              style={{ boxShadow: '0 4px 16px rgba(108, 63, 197, 0.20)' }}
            />
            {seller.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center verified-glow border-2 border-white">
                <Shield size={13} className="text-white" fill="white" />
              </div>
            )}
          </div>
          <div className="flex gap-2 mb-1">
            {seller.isProvider && (
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6C3FC5, #8B5CF6)', fontFamily: 'Poppins, sans-serif' }}>
                ✓ PRO Seller
              </span>
            )}
          </div>
        </div>

        <h2 className="font-bold text-xl text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {seller.name}
        </h2>
        {seller.isVerified && (
          <div className="flex items-center gap-1 mt-0.5">
            <Shield size={12} className="text-amber-500" />
            <span className="text-xs font-medium text-amber-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Verified Seller
            </span>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-2 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
          {seller.bio}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mt-4 bg-violet-50 rounded-2xl p-3">
          {[
            { label: 'Rating', value: seller.rating.toString(), icon: Star, color: '#F5A623' },
            { label: 'Reviews', value: seller.reviewCount.toString(), icon: Star, color: '#6C3FC5' },
            { label: 'Sales', value: seller.salesCount.toString(), icon: Package, color: '#2ECC71' },
            { label: 'Response', value: seller.responseTime, icon: Clock, color: '#FF7EB3' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif', color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Location & joined */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="flex items-center gap-1">
            <MapPin size={11} />
            <span>{seller.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Package size={11} />
            <span>Member since {seller.joinedYear}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
