// Hafi Marketplace — CreateListing Screen
// Design: Velvet Bazaar — multi-step form, photo upload, condition selector, pricing

import { useState } from 'react';
import { ArrowLeft, Camera, Plus, X, ChevronRight, Zap, Package, Truck, Tag, CheckCircle } from 'lucide-react';
import { CATEGORIES } from '@/lib/mockData';
import { toast } from 'sonner';

interface CreateListingProps {
  onBack: () => void;
  onSuccess?: () => void;
}

const CONDITIONS = [
  { id: 'new', label: 'New', desc: 'Never used, with tags', color: '#6C3FC5' },
  { id: 'like_new', label: 'Like New', desc: 'Used once or twice', color: '#2ECC71' },
  { id: 'good', label: 'Good', desc: 'Gently used, minor signs', color: '#F5A623' },
  { id: 'fair', label: 'Fair', desc: 'Visible wear, still works', color: '#9CA3AF' },
];

const SHIPPING_OPTIONS = [
  { id: 'standard', label: 'Standard Delivery', price: 1500, days: '2-3 days' },
  { id: 'express', label: 'Express Delivery', price: 3000, days: 'Same day' },
  { id: 'pickup', label: 'Pickup Only', price: 0, days: 'Arrange with buyer' },
];

export default function CreateListing({ onBack, onSuccess }: CreateListingProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    price: '',
    brand: '',
    isNegotiable: false,
    isBumped: false,
    shipping: [] as string[],
    photos: [] as string[],
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const updateForm = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleShipping = (id: string) => {
    setForm(prev => ({
      ...prev,
      shipping: prev.shipping.includes(id)
        ? prev.shipping.filter(s => s !== id)
        : [...prev.shipping, id],
    }));
  };

  const handleSubmit = () => {
    toast.success('🎉 Your listing is live! Buyers can find it now.', {
      style: { background: 'linear-gradient(135deg, #6C3FC5, #8B5CF6)', color: 'white', border: 'none' },
      duration: 4000,
    });
    setTimeout(() => onSuccess?.(), 1500);
  };

  const canProceed = () => {
    if (step === 1) return form.photos.length > 0 || true; // allow proceed for demo
    if (step === 2) return form.title && form.category && form.condition;
    if (step === 3) return form.price;
    return true;
  };

  return (
    <div className="min-h-screen" style={{ background: '#FAF9FF', paddingBottom: '100px' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100"
        style={{ boxShadow: '0 2px 12px rgba(108, 63, 197, 0.06)' }}>
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft size={16} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '17px' }}>
              List an Item
            </h1>
            <p className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              Step {step} of {totalSteps}
            </p>
          </div>
          <span className="text-xs font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#6C3FC5' }}>
            {Math.round(progress)}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 mx-4 mb-3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6C3FC5, #8B5CF6)' }}
          />
        </div>
      </div>

      <div className="px-5 pt-5">
        {/* STEP 1: Photos */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-bold text-xl text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Add Photos
              </h2>
              <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Up to 10 photos. First photo is your cover image.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Main photo slot */}
              <button
                onClick={() => toast.info('Photo upload coming in full app', { style: { background: '#6C3FC5', color: 'white', border: 'none' } })}
                className="col-span-2 row-span-2 aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
                style={{ borderColor: '#6C3FC5', background: '#F5F3FF', aspectRatio: '1' }}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6C3FC5, #8B5CF6)' }}>
                  <Camera size={24} className="text-white" />
                </div>
                <p className="text-sm font-semibold" style={{ fontFamily: 'Poppins, sans-serif', color: '#6C3FC5' }}>
                  Main Photo
                </p>
                <p className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Tap to add
                </p>
              </button>

              {/* Additional slots */}
              {Array.from({ length: 4 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => toast.info('Photo upload coming in full app', { style: { background: '#6C3FC5', color: 'white', border: 'none' } })}
                  className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center transition-all active:scale-95"
                  style={{ borderColor: '#E8E0FF', background: '#FAF9FF' }}
                >
                  <Plus size={20} className="text-gray-300" />
                </button>
              ))}
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="font-semibold text-sm text-amber-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Tips for great photos
                </p>
                <p className="text-xs text-amber-700 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Use natural light, show all angles, include any defects. Listings with 5+ photos sell 3x faster!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Details */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-bold text-xl text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Item Details
              </h2>
              <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Help buyers find your item.
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => updateForm('title', e.target.value)}
                placeholder="e.g. Charlotte Tilbury Pillow Talk Lipstick"
                className="w-full px-4 py-3.5 rounded-2xl border text-sm outline-none transition-all"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  borderColor: form.title ? '#6C3FC5' : '#E8E0FF',
                  background: '#FAF9FF',
                  color: '#1A1A2E',
                }}
              />
              <p className="text-xs text-gray-400 mt-1 text-right" style={{ fontFamily: 'Inter, sans-serif' }}>
                {form.title.length}/60
              </p>
            </div>

            {/* Brand */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Brand (optional)
              </label>
              <input
                type="text"
                value={form.brand}
                onChange={e => updateForm('brand', e.target.value)}
                placeholder="e.g. MAC, Dyson, The Ordinary"
                className="w-full px-4 py-3.5 rounded-2xl border text-sm outline-none"
                style={{ fontFamily: 'Inter, sans-serif', borderColor: '#E8E0FF', background: '#FAF9FF', color: '#1A1A2E' }}
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Category *
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => updateForm('category', cat.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      background: form.category === cat.id ? 'linear-gradient(135deg, #6C3FC5, #8B5CF6)' : '#F5F3FF',
                      color: form.category === cat.id ? 'white' : '#6B6B8A',
                      border: form.category === cat.id ? 'none' : '1px solid #E8E0FF',
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
              <label className="text-sm font-semibold text-gray-700 mb-2 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Condition *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map(cond => (
                  <button
                    key={cond.id}
                    onClick={() => updateForm('condition', cond.id)}
                    className="p-3 rounded-2xl border-2 text-left transition-all active:scale-95"
                    style={{
                      borderColor: form.condition === cond.id ? cond.color : '#E8E0FF',
                      background: form.condition === cond.id ? `${cond.color}15` : 'white',
                    }}
                  >
                    <p className="font-bold text-sm" style={{ fontFamily: 'Poppins, sans-serif', color: cond.color }}>
                      {cond.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {cond.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={e => updateForm('description', e.target.value)}
                placeholder="Describe your item — size, usage, any defects, why you're selling..."
                rows={4}
                className="w-full px-4 py-3.5 rounded-2xl border text-sm outline-none resize-none"
                style={{ fontFamily: 'Inter, sans-serif', borderColor: '#E8E0FF', background: '#FAF9FF', color: '#1A1A2E' }}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Pricing */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-bold text-xl text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Set Your Price
              </h2>
              <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Price in Rwandan Francs (RWF).
              </p>
            </div>

            {/* Price input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                RWF
              </span>
              <input
                type="number"
                value={form.price}
                onChange={e => updateForm('price', e.target.value)}
                placeholder="0"
                className="w-full pl-20 pr-4 py-5 rounded-2xl border-2 text-2xl font-bold outline-none"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  borderColor: form.price ? '#6C3FC5' : '#E8E0FF',
                  background: '#FAF9FF',
                  color: '#1A1A2E',
                }}
              />
            </div>

            {/* Negotiable toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-semibold text-sm text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Accept Offers
                </p>
                <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Allow buyers to negotiate the price
                </p>
              </div>
              <button
                onClick={() => updateForm('isNegotiable', !form.isNegotiable)}
                className="w-12 h-6 rounded-full transition-all duration-200 relative"
                style={{ background: form.isNegotiable ? '#6C3FC5' : '#E5E7EB' }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
                  style={{ left: form.isNegotiable ? '26px' : '2px' }}
                />
              </button>
            </div>

            {/* Bump feature */}
            <div
              className="p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-98"
              style={{
                borderColor: form.isBumped ? '#F5A623' : '#E8E0FF',
                background: form.isBumped ? '#FFFBEB' : 'white',
              }}
              onClick={() => updateForm('isBumped', !form.isBumped)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Zap size={18} className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Boost Listing
                    </p>
                    <span className="text-xs font-bold text-amber-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      +RWF 2,000
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Appear at the top of search results for 7 days. 5x more views!
                  </p>
                </div>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ borderColor: form.isBumped ? '#F5A623' : '#E8E0FF', background: form.isBumped ? '#F5A623' : 'white' }}
                >
                  {form.isBumped && <CheckCircle size={12} className="text-white" />}
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '15px' }}>
                Shipping Options
              </h3>
              <div className="space-y-2">
                {SHIPPING_OPTIONS.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => toggleShipping(opt.id)}
                    className="flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-98"
                    style={{
                      borderColor: form.shipping.includes(opt.id) ? '#6C3FC5' : '#E8E0FF',
                      background: form.shipping.includes(opt.id) ? '#F5F3FF' : 'white',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Truck size={16} style={{ color: form.shipping.includes(opt.id) ? '#6C3FC5' : '#9CA3AF' }} />
                      <div>
                        <p className="font-semibold text-sm text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {opt.days}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif', color: opt.price === 0 ? '#2ECC71' : '#1A1A2E' }}>
                      {opt.price === 0 ? 'FREE' : `RWF ${opt.price.toLocaleString()}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Publish */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-bold text-xl text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Review & Publish
              </h2>
              <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Your listing is ready to go live!
              </p>
            </div>

            {/* Summary card */}
            <div className="hafi-card p-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Package size={28} style={{ color: '#6C3FC5' }} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {form.title || 'Your Item'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {form.category && `${form.category} · `}{form.condition}
                  </p>
                  <p className="font-bold text-lg mt-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#F5A623' }}>
                    {form.price ? `RWF ${parseInt(form.price).toLocaleString()}` : 'Price not set'}
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              {[
                { label: 'Photos added', done: true },
                { label: 'Title & description', done: !!form.title },
                { label: 'Category selected', done: !!form.category },
                { label: 'Condition set', done: !!form.condition },
                { label: 'Price set', done: !!form.price },
                { label: 'Shipping option', done: form.shipping.length > 0 },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {item.done && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <span className="text-sm" style={{ fontFamily: 'Inter, sans-serif', color: item.done ? '#1A1A2E' : '#9CA3AF' }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Platform fee notice */}
            <div className="bg-violet-50 rounded-2xl p-4">
              <p className="font-semibold text-sm text-violet-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Platform Fee
              </p>
              <p className="text-xs text-violet-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                Hafi charges a 5% fee on successful sales. No listing fee. You only pay when you sell!
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              <Tag size={12} />
              <span>By listing, you agree to Hafi's Marketplace Terms & Seller Guidelines.</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-100"
        style={{ maxWidth: '430px', margin: '0 auto', boxShadow: '0 -4px 20px rgba(108, 63, 197, 0.08)' }}>
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-4 rounded-2xl border border-gray-200 font-semibold text-gray-600 transition-all active:scale-95"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              className="hafi-btn-primary flex-2 py-4 font-bold text-sm flex items-center justify-center gap-2"
              style={{ flex: step > 1 ? 2 : 1 }}
            >
              Continue
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="hafi-btn-gold flex-2 py-4 font-bold text-sm flex items-center justify-center gap-2"
              style={{ flex: 2 }}
            >
              <Zap size={16} />
              Publish Listing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
