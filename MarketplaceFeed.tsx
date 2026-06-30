// Hafi Marketplace — MarketplaceFeed Screen
// Design: Velvet Bazaar — Pinterest masonry grid, search bar, category pills, trending/just listed sections

import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, MapPin, Zap, Clock, Grid3X3, List, Bell, X } from 'lucide-react';
import MarketplaceCard from '@/components/MarketplaceCard';
import FilterBottomSheet from '@/components/FilterBottomSheet';
import { MOCK_ITEMS, CATEGORIES, MarketplaceItem } from '@/lib/mockData';

interface MarketplaceFeedProps {
  onItemClick: (item: MarketplaceItem) => void;
}

export default function MarketplaceFeed({ onItemClick }: MarketplaceFeedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'masonry' | 'list'>('masonry');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [activeSection, setActiveSection] = useState<'all' | 'trending' | 'nearby' | 'new'>('all');

  const filteredItems = useMemo(() => {
    let items = [...MOCK_ITEMS];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.brand?.toLowerCase().includes(q) ||
        i.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (activeCategory !== 'all') {
      items = items.filter(i => i.category === activeCategory);
    }
    if (activeSection === 'trending') {
      items = items.sort((a, b) => b.likes - a.likes);
    } else if (activeSection === 'nearby') {
      items = items.filter(i => parseFloat(i.distance) < 10);
    } else if (activeSection === 'new') {
      items = items.filter(i => i.listedAt.includes('hour') || i.listedAt.includes('min'));
    }
    // Bumped items first
    return items.sort((a, b) => (b.isBumped ? 1 : 0) - (a.isBumped ? 1 : 0));
  }, [searchQuery, activeCategory, activeSection, activeFilters]);

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className="min-h-screen" style={{ background: '#FAF9FF', paddingBottom: '80px' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100"
        style={{ boxShadow: '0 2px 12px rgba(108, 63, 197, 0.06)' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <img src="/manus-storage/hafi-logo-icon_295dfdf7.png" alt="Hafi" className="w-8 h-8 rounded-xl" />
            <div>
              <h1 className="font-extrabold text-lg leading-none" style={{ fontFamily: 'Poppins, sans-serif', color: '#1A1A2E' }}>
                Hafi
              </h1>
              <p className="text-xs" style={{ fontFamily: 'Inter, sans-serif', color: '#6B6B8A' }}>
                Marketplace
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center">
              <Bell size={18} style={{ color: '#6C3FC5' }} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-400 rounded-full border-2 border-white" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search beauty, tools, skincare..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl text-sm outline-none border"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: '#F5F3FF',
                borderColor: searchQuery ? '#6C3FC5' : 'transparent',
                color: '#1A1A2E',
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: activeFilterCount > 0 ? 'linear-gradient(135deg, #6C3FC5, #8B5CF6)' : '#F5F3FF' }}
          >
            <SlidersHorizontal size={18} style={{ color: activeFilterCount > 0 ? 'white' : '#6C3FC5' }} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full text-xs font-bold text-gray-900 flex items-center justify-center"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 active:scale-95"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: activeCategory === cat.id ? 'linear-gradient(135deg, #6C3FC5, #8B5CF6)' : 'white',
                color: activeCategory === cat.id ? 'white' : '#6B6B8A',
                border: activeCategory === cat.id ? 'none' : '1px solid #E8E0FF',
                boxShadow: activeCategory === cat.id ? '0 2px 8px rgba(108,63,197,0.25)' : 'none',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Section tabs + view toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[
              { id: 'all', label: 'All', icon: null },
              { id: 'trending', label: 'Trending', icon: Zap },
              { id: 'nearby', label: 'Near Me', icon: MapPin },
              { id: 'new', label: 'New', icon: Clock },
            ].map(sec => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  background: activeSection === sec.id ? 'white' : 'transparent',
                  color: activeSection === sec.id ? '#6C3FC5' : '#9CA3AF',
                  boxShadow: activeSection === sec.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {sec.icon && <sec.icon size={11} />}
                {sec.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('masonry')}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: viewMode === 'masonry' ? '#6C3FC5' : '#F5F3FF' }}
            >
              <Grid3X3 size={14} style={{ color: viewMode === 'masonry' ? 'white' : '#6B6B8A' }} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: viewMode === 'list' ? '#6C3FC5' : '#F5F3FF' }}
            >
              <List size={14} style={{ color: viewMode === 'list' ? 'white' : '#6B6B8A' }} />
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
          {filteredItems.length} items found
          {searchQuery && ` for "${searchQuery}"`}
        </p>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <img src="/manus-storage/hafi-empty-state_c4f7591e.png" alt="No results" className="w-32 h-32 mb-4 opacity-80" />
            <h3 className="font-bold text-gray-700 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
              No items found
            </h3>
            <p className="text-sm text-gray-400 text-center mt-1 max-w-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              Try adjusting your search or filters to discover more beauty treasures.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); setActiveFilters({}); }}
              className="hafi-btn-primary mt-4 px-6 py-2.5 text-sm font-semibold"
            >
              Clear Filters
            </button>
          </div>
        ) : viewMode === 'masonry' ? (
          <div className="masonry-grid">
            {filteredItems.map(item => (
              <MarketplaceCard
                key={item.id}
                item={item}
                variant="masonry"
                onClick={() => onItemClick(item)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map(item => (
              <MarketplaceCard
                key={item.id}
                item={item}
                variant="list"
                onClick={() => onItemClick(item)}
              />
            ))}
          </div>
        )}
      </div>

      <FilterBottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={setActiveFilters}
        initialFilters={activeFilters}
      />
    </div>
  );
}
