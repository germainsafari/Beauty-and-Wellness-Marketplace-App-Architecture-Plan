// Hafi Marketplace — Mock Data
// Design: Velvet Bazaar / Afro-Luxe Modernism

export type Condition = 'new' | 'like_new' | 'good' | 'fair';

export interface MarketplaceItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  condition: Condition;
  category: string;
  brand?: string;
  description: string;
  images: string[];
  seller: Seller;
  location: string;
  distance: string;
  isNegotiable: boolean;
  isBumped: boolean;
  isFavorited: boolean;
  hasBuyerProtection: boolean;
  views: number;
  likes: number;
  listedAt: string;
  tags: string[];
  shipping: ShippingOption[];
  size?: string;
}

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  responseTime: string;
  isVerified: boolean;
  isProvider: boolean;
  joinedYear: number;
  salesCount: number;
  location: string;
  bio: string;
}

export interface ShippingOption {
  method: string;
  price: number;
  days: string;
}

export interface Offer {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  amount: number;
  status: 'pending' | 'accepted' | 'declined' | 'countered';
  message?: string;
  createdAt: string;
}

export const CATEGORIES = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'skincare', label: 'Skincare', icon: '🧴' },
  { id: 'makeup', label: 'Makeup', icon: '💄' },
  { id: 'haircare', label: 'Haircare', icon: '💇' },
  { id: 'tools', label: 'Tools', icon: '🪄' },
  { id: 'fragrance', label: 'Fragrance', icon: '🌸' },
  { id: 'nails', label: 'Nails', icon: '💅' },
  { id: 'wellness', label: 'Wellness', icon: '🌿' },
  { id: 'furniture', label: 'Salon Furniture', icon: '🪑' },
];

const UNSPLASH_BEAUTY = [
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80',
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80',
  'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&q=80',
  'https://images.unsplash.com/photo-1631730486784-74757073e8f5?w=400&q=80',
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80',
  'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400&q=80',
  'https://images.unsplash.com/photo-1583241800698-e8ab01830a22?w=400&q=80',
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&q=80',
  'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=400&q=80',
  'https://images.unsplash.com/photo-1586495777744-4e6232bf2e99?w=400&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
];

const AVATAR_URLS = [
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
];

export const MOCK_SELLERS: Seller[] = [
  {
    id: 's1',
    name: 'Amara Beauty',
    avatar: AVATAR_URLS[0],
    rating: 4.9,
    reviewCount: 127,
    responseTime: '< 1 hour',
    isVerified: true,
    isProvider: true,
    joinedYear: 2022,
    salesCount: 89,
    location: 'Kigali, Rwanda',
    bio: 'Professional makeup artist & beauty enthusiast. All items are authentic and carefully packaged. 💜',
  },
  {
    id: 's2',
    name: 'Zara Glow',
    avatar: AVATAR_URLS[1],
    rating: 4.7,
    reviewCount: 43,
    responseTime: '< 3 hours',
    isVerified: false,
    isProvider: false,
    joinedYear: 2023,
    salesCount: 31,
    location: 'Butare, Rwanda',
    bio: 'Skincare lover selling my gently used collection. Fast shipping! ✨',
  },
  {
    id: 's3',
    name: 'Lux Hair Studio',
    avatar: AVATAR_URLS[2],
    rating: 5.0,
    reviewCount: 212,
    responseTime: '< 30 min',
    isVerified: true,
    isProvider: true,
    joinedYear: 2021,
    salesCount: 156,
    location: 'Kigali, Rwanda',
    bio: 'Professional hair salon. Selling salon-grade tools and products at great prices.',
  },
  {
    id: 's4',
    name: 'Bella Cosmetics',
    avatar: AVATAR_URLS[3],
    rating: 4.6,
    reviewCount: 78,
    responseTime: '< 2 hours',
    isVerified: true,
    isProvider: false,
    joinedYear: 2022,
    salesCount: 62,
    location: 'Musanze, Rwanda',
    bio: 'Beauty blogger & collector. Authentic products only. 🌸',
  },
];

export const MOCK_ITEMS: MarketplaceItem[] = [
  {
    id: 'i1',
    title: 'Charlotte Tilbury Pillow Talk Lipstick',
    price: 12000,
    originalPrice: 18000,
    condition: 'like_new',
    category: 'makeup',
    brand: 'Charlotte Tilbury',
    description: 'Iconic nude-pink lipstick. Used twice, still has 95% product. Comes with original box. Perfect for everyday glam.',
    images: [UNSPLASH_BEAUTY[0], UNSPLASH_BEAUTY[5]],
    seller: MOCK_SELLERS[0],
    location: 'Kigali',
    distance: '2.3 km',
    isNegotiable: true,
    isBumped: true,
    isFavorited: false,
    hasBuyerProtection: true,
    views: 234,
    likes: 47,
    listedAt: '2 hours ago',
    tags: ['lipstick', 'nude', 'luxury'],
    shipping: [
      { method: 'Standard', price: 1500, days: '2-3 days' },
      { method: 'Express', price: 3000, days: 'Same day' },
    ],
  },
  {
    id: 'i2',
    title: 'Dyson Airwrap Complete Styler',
    price: 85000,
    condition: 'good',
    category: 'tools',
    brand: 'Dyson',
    description: 'Complete Dyson Airwrap set with all attachments. Barely used — purchased 6 months ago. Original box included. Selling because I moved abroad.',
    images: [UNSPLASH_BEAUTY[2], UNSPLASH_BEAUTY[8]],
    seller: MOCK_SELLERS[2],
    location: 'Kigali',
    distance: '0.8 km',
    isNegotiable: false,
    isBumped: false,
    isFavorited: true,
    hasBuyerProtection: true,
    views: 891,
    likes: 203,
    listedAt: '1 day ago',
    tags: ['dyson', 'hair tools', 'styling'],
    shipping: [
      { method: 'Standard', price: 2000, days: '2-3 days' },
    ],
  },
  {
    id: 'i3',
    title: 'La Mer Crème de la Mer Moisturizer',
    price: 32000,
    originalPrice: 55000,
    condition: 'new',
    category: 'skincare',
    brand: 'La Mer',
    description: 'Brand new, sealed. Received as a gift but already have one. Full size 30ml. Authentic with receipt.',
    images: [UNSPLASH_BEAUTY[1], UNSPLASH_BEAUTY[9]],
    seller: MOCK_SELLERS[3],
    location: 'Musanze',
    distance: '45 km',
    isNegotiable: true,
    isBumped: false,
    isFavorited: false,
    hasBuyerProtection: true,
    views: 567,
    likes: 89,
    listedAt: '3 hours ago',
    tags: ['skincare', 'moisturizer', 'luxury'],
    shipping: [
      { method: 'Standard', price: 2500, days: '3-4 days' },
      { method: 'Express', price: 5000, days: '1-2 days' },
    ],
  },
  {
    id: 'i4',
    title: 'MAC Studio Fix Powder Foundation',
    price: 8500,
    condition: 'good',
    category: 'makeup',
    brand: 'MAC',
    description: 'Shade NC35. About 70% remaining. Kept in clean storage. Great for medium coverage.',
    images: [UNSPLASH_BEAUTY[3]],
    seller: MOCK_SELLERS[1],
    location: 'Butare',
    distance: '130 km',
    isNegotiable: true,
    isBumped: false,
    isFavorited: false,
    hasBuyerProtection: false,
    views: 123,
    likes: 18,
    listedAt: '5 days ago',
    tags: ['foundation', 'MAC', 'powder'],
    shipping: [
      { method: 'Standard', price: 1500, days: '3-5 days' },
    ],
  },
  {
    id: 'i5',
    title: 'Professional Nail Lamp UV/LED',
    price: 15000,
    condition: 'like_new',
    category: 'nails',
    brand: 'Melodysusie',
    description: '48W professional nail lamp. Used for 3 months in home salon. Works perfectly. Comes with USB cable and manual.',
    images: [UNSPLASH_BEAUTY[4], UNSPLASH_BEAUTY[10]],
    seller: MOCK_SELLERS[2],
    location: 'Kigali',
    distance: '1.2 km',
    isNegotiable: false,
    isBumped: true,
    isFavorited: false,
    hasBuyerProtection: true,
    views: 445,
    likes: 67,
    listedAt: '12 hours ago',
    tags: ['nail lamp', 'gel nails', 'professional'],
    shipping: [
      { method: 'Standard', price: 2000, days: '2-3 days' },
      { method: 'Pickup', price: 0, days: 'Today' },
    ],
  },
  {
    id: 'i6',
    title: 'Chanel No. 5 Eau de Parfum 50ml',
    price: 45000,
    condition: 'new',
    category: 'fragrance',
    brand: 'Chanel',
    description: 'Sealed, never opened. Authentic Chanel No. 5 EDP. Purchased duty-free. Selling due to preference change.',
    images: [UNSPLASH_BEAUTY[6]],
    seller: MOCK_SELLERS[0],
    location: 'Kigali',
    distance: '2.3 km',
    isNegotiable: false,
    isBumped: false,
    isFavorited: true,
    hasBuyerProtection: true,
    views: 678,
    likes: 134,
    listedAt: '2 days ago',
    tags: ['chanel', 'perfume', 'luxury'],
    shipping: [
      { method: 'Standard', price: 2000, days: '2-3 days' },
    ],
  },
  {
    id: 'i7',
    title: 'Salon Styling Chair - Black Leather',
    price: 120000,
    condition: 'good',
    category: 'furniture',
    description: 'Professional hydraulic styling chair. Black faux leather. 3 years old but well maintained. Selling because upgrading salon.',
    images: [UNSPLASH_BEAUTY[7]],
    seller: MOCK_SELLERS[2],
    location: 'Kigali',
    distance: '0.8 km',
    isNegotiable: true,
    isBumped: false,
    isFavorited: false,
    hasBuyerProtection: true,
    views: 234,
    likes: 29,
    listedAt: '1 week ago',
    tags: ['salon chair', 'furniture', 'professional'],
    shipping: [
      { method: 'Pickup Only', price: 0, days: 'Arrange with seller' },
    ],
  },
  {
    id: 'i8',
    title: 'The Ordinary Skincare Bundle',
    price: 18000,
    originalPrice: 28000,
    condition: 'new',
    category: 'skincare',
    brand: 'The Ordinary',
    description: 'Bundle of 5 The Ordinary serums: Niacinamide, Hyaluronic Acid, Vitamin C, AHA/BHA, and Retinol. All sealed.',
    images: [UNSPLASH_BEAUTY[11], UNSPLASH_BEAUTY[9]],
    seller: MOCK_SELLERS[1],
    location: 'Butare',
    distance: '130 km',
    isNegotiable: true,
    isBumped: false,
    isFavorited: false,
    hasBuyerProtection: false,
    views: 389,
    likes: 71,
    listedAt: '4 hours ago',
    tags: ['skincare', 'serum', 'bundle'],
    shipping: [
      { method: 'Standard', price: 2000, days: '3-5 days' },
    ],
  },
];

export const MOCK_OFFERS: Offer[] = [
  {
    id: 'o1',
    buyerId: 'u1',
    buyerName: 'Claudine M.',
    buyerAvatar: AVATAR_URLS[4],
    amount: 10000,
    status: 'pending',
    message: 'Hi! Would you accept 10,000 RWF? I can pick up today.',
    createdAt: '5 minutes ago',
  },
  {
    id: 'o2',
    buyerId: 'u2',
    buyerName: 'Patrick N.',
    buyerAvatar: AVATAR_URLS[2],
    amount: 11500,
    status: 'countered',
    message: 'Best offer I can do is 11,500 RWF.',
    createdAt: '2 hours ago',
  },
];

export function formatPrice(amount: number): string {
  return `RWF ${amount.toLocaleString()}`;
}

export function getConditionLabel(condition: Condition): string {
  const labels: Record<Condition, string> = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
  };
  return labels[condition];
}

export function getConditionClass(condition: Condition): string {
  const classes: Record<Condition, string> = {
    new: 'badge-new',
    like_new: 'badge-like-new',
    good: 'badge-good',
    fair: 'badge-fair',
  };
  return classes[condition];
}
