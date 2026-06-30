// Hafi Marketplace — BottomNav Component
// Design: Velvet Bazaar — violet active state, smooth tab transitions

import { Home, Search, ShoppingBag, Calendar, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Search },
  { id: 'market', label: 'Market', icon: ShoppingBag },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100"
      style={{ boxShadow: '0 -4px 24px rgba(108, 63, 197, 0.08)', maxWidth: '430px', margin: '0 auto' }}>
      <div className="flex items-center justify-around px-2 py-2">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-90"
              style={{
                background: isActive ? 'linear-gradient(135deg, rgba(108,63,197,0.12), rgba(139,92,246,0.08))' : 'transparent',
              }}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className="transition-all duration-200"
                  style={{ color: isActive ? '#6C3FC5' : '#9CA3AF' }}
                />
                {id === 'market' && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-400 rounded-full text-white text-xs flex items-center justify-center"
                    style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '9px', fontWeight: 700 }}>
                    3
                  </span>
                )}
              </div>
              <span
                className="text-xs font-medium transition-all duration-200"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '10px',
                  color: isActive ? '#6C3FC5' : '#9CA3AF',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
