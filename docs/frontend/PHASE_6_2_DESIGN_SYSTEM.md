# BIGCHAMP Phase 6.2: Design System & Visual Specification

**Brand:** BIGCHAMP Sports & Athletic Wellness  
**Design Paradigm:** Premium Athletic Retail Flagship  
**Framework:** React + Tailwind CSS + Vanilla CSS Tokens

---

## 1. Color Palette & Surface Architecture

BIGCHAMP utilizes a disciplined, high-contrast palette calibrated for sportswear retail:

### Primary Palette (Athletic Navy)
- `primary-950`: `#030712` / `#0A192F` (Deep stadium navy; hero backgrounds, dark footer, primary badges)
- `primary-900`: `#0F172A` / `#1E3A8A` (Authoritative heading navy, primary buttons)
- `primary-800`: `#1E40AF` (Hover button surfaces)
- `primary-50`: `#EFF6FF` (Subtle tint for badges, selected pills)

### Brand Accent (Energetic Athletic Orange)
- `accent-500`: `#F97316` (Primary action CTA, price highlights, cart badges)
- `accent-600`: `#EA580C` (Hover state for buttons, active links)
- `accent-400`: `#FB923C` (Text highlights on dark surfaces, glowing rings)
- `accent-50`: `#FFF7ED` (Warm promotion backgrounds)

### Neutral & Background Scale
- `white`: `#FFFFFF` (Product card canvas, header background, modal sheets)
- `slate-50`: `#F8FAFC` (Page surface canvas, off-white background)
- `slate-100`: `#F1F5F9` (Pills, secondary button background, borders)
- `slate-200`: `#E2E8F0` (Card borders, dividers)
- `slate-500`: `#64748B` (Secondary metadata, breadcrumb text)
- `slate-900`: `#0F172A` (Primary body text, product titles)

### Semantic Colors
- `emerald-500` / `emerald-600`: `#10B981` (Verified athlete badges, in-stock indicators)
- `amber-400` / `amber-500`: `#F59E0B` (Review star ratings, Cookey privilege pills)
- `rose-600`: `#E11D48` (Out of stock indicators, sale urgency tags)

---

## 2. Typography System

The typography pairs an authoritative geometric display font with a legible sans-serif for commerce metadata.

### Display Heading Font: `Plus Jakarta Sans`
Loaded via Google Fonts (`weights: 500, 600, 700, 800, 900`).
- **Hero Title (`h1`):** `text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-[1.08]`
- **Section Headers (`h2`):** `text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display tracking-tight text-slate-900`
- **Sub-Headings (`h3`):** `text-xl sm:text-2xl font-black font-display text-slate-900`
- **Eyebrow / Overline:** `text-[11px] font-bold uppercase tracking-[0.2em] text-accent-600`

### Body & Interface Font: `Inter`
Loaded via Google Fonts (`weights: 400, 500, 600, 700`).
- **Body Text:** `text-sm sm:text-base text-slate-600 font-normal leading-relaxed`
- **Product Titles:** `text-sm font-bold text-slate-900 line-clamp-2`
- **Price Highlights:** `text-base sm:text-lg font-extrabold text-slate-900`
- **Member Savings:** `text-[11px] font-semibold text-accent-600 flex items-center gap-0.5`

---

## 3. Elevation & Shadow Tokens

- **`shadow-sm`**: `0 1px 2px 0 rgb(0 0 0 / 0.05)` (Default card rest state)
- **`shadow-md`**: `0 4px 6px -1px rgb(0 0 0 / 0.1)` (Filter pills, interactive buttons)
- **`shadow-xl`**: `0 20px 25px -5px rgb(0 0 0 / 0.1)` (Card hover elevation, modals)
- **`shadow-glow-accent`**: `0 0 25px -5px rgba(249, 115, 22, 0.3)` (CTA button focus, sale cards)
- **`shadow-premium`**: `0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)`

---

## 4. Component Rules & Layout Specifications

### A. Circular Collection Discovery (`CategoryPillsStrip.jsx`)
- Aspect Ratio: `1:1` circle.
- Size: `w-36 h-36` on mobile, `w-44 h-44` on desktop.
- Border Treatment: `p-1.5` gradient ring (`from-slate-200 to-accent-200`, transitioning to `from-accent-500 to-primary-600` on hover).
- Image: `rounded-full overflow-hidden border-2 border-white`.
- Interaction: Scale `1.05` on hover with `duration-500` smooth transition.

### B. Product Cards (`ProductCard.jsx`)
- Container: `bg-white rounded-2xl border border-slate-200/80 hover:border-primary-300 hover:shadow-xl transition-all duration-300`.
- Image Aspect Ratio: Strictly `1:1` square (`aspect-square`).
- Image Fit: `object-cover group-hover:scale-105 transition-transform duration-500`.
- Badges: Absolute top-left `bg-primary-950/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full`.
- Price Block: Current price in `text-base sm:text-lg font-extrabold text-slate-900`; Member price in `text-[11px] font-semibold text-accent-600`.
- Quick Add Button: `bg-primary-900 hover:bg-primary-800 active:scale-95 text-white p-2.5 rounded-xl`.

### C. 3-Column Editorial Showcase (`EditorialShowcase.jsx`)
- Height: `480px` on mobile, `540px` on desktop.
- Radius: `rounded-3xl overflow-hidden`.
- Gradient: Double gradient with bottom dark gradient `from-slate-950 via-slate-950/40 to-transparent` ensuring 100% white text contrast regardless of background photo luminosity.
- Typography: Large `text-2xl sm:text-3xl font-extrabold font-display` with animated arrow link (`group-hover:translate-x-1.5`).

### D. Full-Bleed Seasonal Sale Banner (`SeasonalSaleBanner.jsx`)
- Minimum Height: `420px` to `460px`.
- Radius: `rounded-3xl overflow-hidden shadow-2xl`.
- Background: Real celebratory athletic team photo with warm stadium lighting.
- Contrast: Left-to-right dark gradient overlay (`from-slate-950 via-slate-950/85 to-transparent`).

---

## 5. Responsive Breakpoints

| Viewport | Target Device | Grid Columns | Padding / Margins |
| :--- | :--- | :--- | :--- |
| `< 640px` | Mobile (360px – 390px) | 2 Columns for products & collections; 1 Column for hero | `px-4 py-8` |
| `640px – 1024px` | Tablet (768px) | 3 Columns for products; 2 Columns for collections | `px-6 py-10` |
| `> 1024px` | Desktop (1280px – 1440px) | 4 Columns for products & collections; 3 Columns for editorial | `px-8 py-12` |
