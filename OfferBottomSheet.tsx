// Hafi Marketplace — OfferBottomSheet Component
// Design: Velvet Bazaar — Vinted-style price negotiation modal, gold accents

import { useState } from 'react';
import { X, MessageCircle, TrendingDown, CheckCircle, XCircle } from 'lucide-react';
import { MarketplaceItem, formatPrice } from '@/lib/mockData';
import { toast } from 'sonner';

interface OfferBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: MarketplaceItem;
  mode?: 'make' | 'respond';
  existingOffer?: { amount: number; buyerName: string; message?: string };
}

export default function OfferBottomSheet({ isOpen, onClose, item, mode = 'make', existingOffer }: OfferBottomSheetProps) {
  const [offerAmount, setOfferAmount] = useState(existingOffer?.amount || Math.floor(item.price * 0.85));
  const [message, setMessage] = useState('');
  const [counterAmount, setCounterAmount] = useState(Math.floor(item.price * 0.95));
  const [step, setStep] = useState<'input' | 'confirm' | 'sent'>('input');
  const [responseMode, setResponseMode] = useState<'accept' | 'decline' | 'counter' | null>(null);

  const discount = Math.round(((item.price - offerAmount) / item.price) * 100);

  const handleSendOffer = () => {
    if (offerAmount <= 0 || offerAmount > item.price) return;
    setStep('confirm');
  };

  const handleConfirmOffer = () => {
    setStep('sent');
    setTimeout(() => {
      toast.success('Offer sent! The seller will respond within 24 hours.', {
        style: { background: '#6C3FC5', color: 'white', border: 'none' },
      });
      onClose();
    }, 1500);
  };

  const handleAccept = () => {
    toast.success(`Offer of ${formatPrice(existingOffer?.amount || 0)} accepted! Proceeding to payment.`, {
      style: { background: '#2ECC71', color: 'white', border: 'none' },
    });
    onClose();
  };

  const handleDecline = () => {
    toast.error('Offer declined.', {
      style: { background: '#E74C3C', color: 'white', border: 'none' },
    });
    onClose();
  };

  const handleCounter = () => {
    toast.success(`Counter offer of ${formatPrice(counterAmount)} sent!`, {
      style: { background: '#6C3FC5', color: 'white', border: 'none' },
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bottom-sheet-overlay" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl"
        style={{
          maxWidth: '430px',
          margin: '0 auto',
          boxShadow: '0 -8px 40px rgba(108, 63, 197, 0.20)',
          animation: 'slideUp 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
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
            <TrendingDown size={18} style={{ color: '#6C3FC5' }} />
            <h2 className="font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '17px' }}>
              {mode === 'make' ? 'Make an Offer' : 'Respond to Offer'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Item preview */}
        <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 mx-4 mt-4 rounded-2xl">
          <img src={item.images[0]} alt={item.title} className="w-14 h-14 rounded-xl object-cover" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900 line-clamp-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {item.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
              Listed by {item.seller.name}
            </p>
            <p className="font-bold text-base mt-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#F5A623' }}>
              {formatPrice(item.price)}
            </p>
          </div>
        </div>

        {/* MAKE OFFER MODE */}
        {mode === 'make' && step === 'input' && (
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Your Offer Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  RWF
                </span>
                <input
                  type="number"
                  value={offerAmount}
                  onChange={e => setOfferAmount(Number(e.target.value))}
                  className="w-full pl-16 pr-4 py-4 rounded-2xl border-2 text-xl font-bold text-gray-900 outline-none transition-all"
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    borderColor: offerAmount < item.price * 0.5 ? '#E74C3C' : '#6C3FC5',
                    background: '#FAF9FF',
                  }}
                />
              </div>
              {offerAmount < item.price && (
                <p className="text-xs mt-1.5 font-medium" style={{ color: '#2ECC71', fontFamily: 'Inter, sans-serif' }}>
                  {discount}% below asking price
                </p>
              )}
              {offerAmount < item.price * 0.5 && (
                <p className="text-xs mt-1 font-medium" style={{ color: '#E74C3C', fontFamily: 'Inter, sans-serif' }}>
                  Very low offer — seller may decline
                </p>
              )}
            </div>

            {/* Quick offer chips */}
            <div>
              <p className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Quick offers:</p>
              <div className="flex gap-2">
                {[0.95, 0.90, 0.85, 0.80].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setOfferAmount(Math.floor(item.price * pct))}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95"
                    style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      background: offerAmount === Math.floor(item.price * pct) ? 'linear-gradient(135deg, #6C3FC5, #8B5CF6)' : '#F5F3FF',
                      color: offerAmount === Math.floor(item.price * pct) ? 'white' : '#6C3FC5',
                      borderColor: offerAmount === Math.floor(item.price * pct) ? 'transparent' : '#E8E0FF',
                    }}
                  >
                    -{Math.round((1 - pct) * 100)}%
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Add a message (optional)
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Hi! I'm interested in this item..."
                rows={2}
                className="w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  borderColor: '#E8E0FF',
                  background: '#FAF9FF',
                  color: '#1A1A2E',
                }}
              />
            </div>

            <button
              onClick={handleSendOffer}
              disabled={offerAmount <= 0}
              className="hafi-btn-gold w-full py-4 text-base font-bold disabled:opacity-50"
            >
              Send Offer · {formatPrice(offerAmount)}
            </button>
          </div>
        )}

        {/* CONFIRM STEP */}
        {mode === 'make' && step === 'confirm' && (
          <div className="px-5 py-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'linear-gradient(135deg, #6C3FC5, #8B5CF6)' }}>
                <TrendingDown size={28} className="text-white" />
              </div>
              <h3 className="font-bold text-xl text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Confirm Your Offer
              </h3>
              <p className="text-3xl font-bold mt-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#F5A623' }}>
                {formatPrice(offerAmount)}
              </p>
              <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                {discount}% below asking price of {formatPrice(item.price)}
              </p>
            </div>
            <div className="bg-violet-50 rounded-2xl p-4 text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              <p className="font-semibold text-violet-700 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>How it works:</p>
              <p>The seller has 24 hours to accept, decline, or counter your offer. You won't be charged until they accept.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('input')} className="flex-1 py-3 rounded-2xl border border-gray-200 font-semibold text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Edit
              </button>
              <button onClick={handleConfirmOffer} className="hafi-btn-gold flex-1 py-3 font-bold">
                Send Offer
              </button>
            </div>
          </div>
        )}

        {/* SENT STEP */}
        {mode === 'make' && step === 'sent' && (
          <div className="px-5 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h3 className="font-bold text-xl text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Offer Sent!</h3>
            <p className="text-sm text-gray-500 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Waiting for seller response...
            </p>
          </div>
        )}

        {/* RESPOND MODE */}
        {mode === 'respond' && existingOffer && (
          <div className="px-5 py-4 space-y-4">
            <div className="bg-amber-50 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center font-bold text-violet-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {existingOffer.buyerName[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{existingOffer.buyerName}</p>
                  <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Made an offer</p>
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#F5A623' }}>
                {formatPrice(existingOffer.amount)}
              </p>
              {existingOffer.message && (
                <p className="text-sm text-gray-600 mt-2 italic" style={{ fontFamily: 'Inter, sans-serif' }}>
                  "{existingOffer.message}"
                </p>
              )}
            </div>

            {!responseMode && (
              <div className="space-y-2">
                <button onClick={handleAccept} className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #2ECC71, #10B981)', fontFamily: 'Poppins, sans-serif' }}>
                  <CheckCircle size={18} />
                  Accept Offer
                </button>
                <button onClick={() => setResponseMode('counter')} className="hafi-btn-primary w-full py-3.5 font-bold flex items-center justify-center gap-2">
                  <MessageCircle size={18} />
                  Counter Offer
                </button>
                <button onClick={handleDecline} className="w-full py-3.5 rounded-2xl border border-red-200 font-semibold text-red-500 flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <XCircle size={18} />
                  Decline
                </button>
              </div>
            )}

            {responseMode === 'counter' && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Your Counter Offer
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>RWF</span>
                  <input
                    type="number"
                    value={counterAmount}
                    onChange={e => setCounterAmount(Number(e.target.value))}
                    className="w-full pl-16 pr-4 py-4 rounded-2xl border-2 text-xl font-bold outline-none"
                    style={{ fontFamily: 'Space Grotesk, sans-serif', borderColor: '#6C3FC5', background: '#FAF9FF', color: '#1A1A2E' }}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setResponseMode(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 font-semibold text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Back
                  </button>
                  <button onClick={handleCounter} className="hafi-btn-gold flex-1 py-3 font-bold">
                    Send Counter
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="h-6" />
      </div>
    </>
  );
}
