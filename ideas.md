# Hafi Marketplace — Design Brainstorm

## Three Stylistic Approaches

### 1. "Velvet Bazaar"
A rich, tactile marketplace feel inspired by luxury boutiques and African artisan markets. Deep violet backgrounds, gold accents, and soft glowing cards. Probability: **0.07**

### 2. "Pastel Studio"
Clean, airy, Pinterest-meets-Depop aesthetic. Soft pastel gradients, rounded everything, playful typography, and card-forward layouts. Probability: **0.05**

### 3. "Neon Souk"
Bold, energetic, streetwear-meets-beauty. Dark backgrounds with electric violet and gold neon glows, sharp cards, and kinetic micro-animations. Probability: **0.03**

---

## Chosen Approach: **"Velvet Bazaar"** (Probability: 0.07)

### Design Movement
Afro-Luxe Modernism — the aesthetic confidence of African luxury retail fused with the clean UX patterns of modern C2C marketplaces (Vinted, Depop).

### Core Principles
1. **Warmth through depth** — every surface has subtle gradient and shadow, never flat
2. **Gold as signal** — gold/amber is reserved for price, CTA, and trust badges only
3. **Violet as home** — deep violet is the brand anchor, used for headers, active states, and brand moments
4. **Generous whitespace** — cards breathe, sections have rhythm

### Color Philosophy
- **Background**: `#FAF9FF` (off-white with a violet tint) — feels premium, not clinical
- **Primary**: `#6C3FC5` (Deep Violet) — authority, luxury, trust
- **Gold**: `#F5A623` (Amber Gold) — prices, CTAs, highlights
- **Rose Accent**: `#FF7EB3` — heart/save actions, feminine energy
- **Surface**: `#FFFFFF` with `box-shadow: 0 4px 24px rgba(108,63,197,0.10)`
- **Text Primary**: `#1A1A2E` — near-black with violet undertone
- **Text Secondary**: `#6B6B8A` — muted, readable

### Layout Paradigm
Asymmetric masonry grid for the marketplace feed (Pinterest-style). Left-rail navigation on desktop. Mobile-first bottom tab bar. Cards have intentional size variation — not uniform rows.

### Signature Elements
1. **Violet-to-rose gradient pill badges** for condition labels
2. **Gold shimmer hover effect** on product cards
3. **Floating bottom sheet** modals for filters and offers (Vinted-style)

### Interaction Philosophy
Every tap gives physical feedback. Cards scale on press. Offers animate in from the bottom. The heart icon pulses when saved. Confirmations celebrate with a subtle confetti burst.

### Animation
- Card press: `scale(0.97)` → `scale(1.02)` → `scale(1)` in 200ms
- Bottom sheets: slide up from 0% to 100% with spring easing
- Skeleton loaders: shimmer from left to right
- Heart save: pulse scale 1 → 1.3 → 1 with rose color fill

### Typography System
- **Display/Headings**: Poppins Bold — confident, rounded, modern
- **Body**: Inter Regular/Medium — clean, legible
- **Prices**: Space Grotesk Bold — technical precision for numbers
- Hierarchy: 32px display → 24px h1 → 18px h2 → 16px body → 12px caption

### Brand Essence
*Hafi is where beauty meets community — a marketplace for the self-care generation, built for Africa.*
Personality: **Warm. Confident. Trustworthy.**

### Brand Voice
Headlines: "Your glow, your price." / "Beauty finds a new home."
CTAs: "Claim it" / "Make an offer" / "List yours"
No filler: Never "Welcome to Hafi" or "Get started today"

### Wordmark & Logo
A stylized "H" formed by two mirrored beauty scissors, enclosed in a soft violet rounded square. Clean, recognizable at small sizes.

### Signature Brand Color
`#6C3FC5` — Deep Violet. Unmistakably Hafi.
