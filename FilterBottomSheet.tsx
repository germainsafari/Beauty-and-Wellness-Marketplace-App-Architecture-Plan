// Hafi Marketplace — FilterBottomSheet Component
// Design: Velvet Bazaar — slides up from bottom, violet accents, pill filter chips

import { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { CATEGORIES } from '@/lib/mockData';

interface FilterState {
  category: string;
  condition: string[];
  priceMin: number;
  priceMax: number;
  maxDistance: number;
  sortBy: string;
}

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
}

const CONDITIONS = [
  { id: 'new', label: 'New' },
  { id: 'like_new', label: 'Like New' },
  { id: 'good', label: 'Good' },
  { id: 'fair', label: 'Fair' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'distance', label: 'Nearest First' },
  { id: 'popular', label: 'Most Popular' },
];

export default function FilterBottomSheet({ isOpen, onClose, onApply, initialFilters }: FilterBottomSheetProps) {
  const [filters, setFilters] = useState<FilterState>({
    category: initialFilters?.category || 'all',
    condition: initialFilters?.condition || [],
    priceMin: initialFilters?.priceMin || 0,
    priceMax: initialFilters?.priceMax || 200000,
    maxDistance: initialFilters?.maxDistance || 50,
    sortBy: initialFilters?.sortBy || 'newest',
  });

  const toggleCondition = (cond: string) => {
    setFilters(prev => ({
      ...prev,
      condition: prev.condition.includes(cond)
        ? prev.condition.filter(c => c !== cond)
        : [...prev.condition, cond],
    }));
  };

  const resetFilters = () => {
    setFilters({
      category: 'all',
      condition: [],
      priceMin: 0,
      priceMax: 200000,
      maxDistance: 50,
      sortBy: 'newest',
    });
  };

  const activeFilterCount = [
    filters.category !== 'all',
    filters.condition.length > 0,
    filters.priceMin > 0 || filters.priceMax < 200000,
    filters.maxDistance < 50,
    filters.sortBy !== 'newest',
  ].filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bottom-sheet-overlay"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl"
        style={{
          maxWidth: '430px',
          margin: '0 auto',
          boxShadow: '0 -8px 40px rgba(108, 63, 197, 0.20)',
          animation: 'slideUp 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} style={{ color: '#6C3FC5' }} />
            <h2 className="font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '17px' }}>
              Filters
            </h2>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
                style={{ background: '#6C3FC5', fontFamily: 'Space Grotesk, sans-serif' }}>
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={resetFilters} className="text-sm font-medium" style={{ color: '#6C3FC5', fontFamily: 'Inter, sans-serif' }}>
              Reset
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-6 pb-32">
          {/* Sort By */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>
              Sort By
            </h3>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilters(prev => ({ ...prev, sortBy: opt.id }))}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-95"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    background: filters.sortBy === opt.id ? 'linear-gradient(135deg, #6C3FC5, #8B5CF6)' : '#F5F3FF',
                    color: filters.sortBy === opt.id ? 'white' : '#6B6B8A',
                    border: filters.sortBy === opt.id ? 'none' : '1px solid #E8E0FF',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>
              Category
            </h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-95 flex items-center gap-1.5"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    background: filters.category === cat.id ? 'linear-gradient(135deg, #6C3FC5, #8B5CF6)' : '#F5F3FF',
                    color: filters.category === cat.id ? 'white' : '#6B6B8A',
                    border: filters.category === cat.id ? 'none' : '1px solid #E8E0FF',
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>
              Condition
            </h3>
            <div className="flex gap-2">
              {CONDITIONS.map(cond => (
                <button
                  key={cond.id}
                  onClick={() => toggleCondition(cond.id)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 border"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    background: filters.condition.includes(cond.id) ? 'linear-gradient(135deg, #6C3FC5, #8B5CF6)' : 'white',
                    color: filters.condition.includes(cond.id) ? 'white' : '#6B6B8A',
                    borderColor: filters.condition.includes(cond.id) ? 'transparent' : '#E8E0FF',
                  }}
                >
                  {cond.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>
                Price Range
              </h3>
              <span className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#F5A623' }}>
                RWF {filters.priceMin.toLocaleString()} – {filters.priceMax.toLocaleString()}
              </span>
            </div>
            <Slider
              min={0}
              max={200000}
              step={1000}
              value={[filters.priceMin, filters.priceMax]}
              onValueChange={([min, max]) => setFilters(prev => ({ ...prev, priceMin: min, priceMax: max }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span>RWF 0</span>
              <span>RWF 200,000+</span>
            </div>
          </div>

          {/* Distance */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>
                Max Distance
              </h3>
              <span className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#F5A623' }}>
                {filters.maxDistance} km
              </span>
            </div>
            <Slider
              min={1}
              max={200}
              step={1}
              value={[filters.maxDistance]}
              onValueChange={([val]) => setFilters(prev => ({ ...prev, maxDistance: val }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span>1 km</span>
              <span>200 km</span>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100"
          style={{ maxWidth: '430px', margin: '0 auto' }}>
          <button
            onClick={() => { onApply(filters); onClose(); }}
            className="hafi-btn-primary w-full py-4 text-base font-bold"
          >
            Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>
      </div>
    </>
  );
}
