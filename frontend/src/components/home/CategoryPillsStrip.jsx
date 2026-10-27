import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { Card3DTilt } from '../3d/Card3DTilt';

export function CategoryPillsStrip({ sectionConfig, categories = [] }) {
  const defaultCollections = [
    {
      name: 'GEARS',
      slug: 'GEARS',
      subtitle: 'Cricket Willow, Match Balls & Tournament Equipment',
      image: 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031778/bigchamp/images/gears.jpg',
      itemCount: 'Pro Equipment',
    },
    {
      name: 'APPAREL',
      slug: 'APPAREL',
      subtitle: 'Velocity Running Shoes, Tracksuits & Compression Wear',
      image: 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031773/bigchamp/images/apparel.jpg',
      itemCount: 'Active Sport',
    },
    {
      name: 'FITNESS',
      slug: 'FITNESS',
      subtitle: 'Cast Iron Hex Dumbbells, Eco Mats & Mobility Ropes',
      image: 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031776/bigchamp/images/fitness.jpg',
      itemCount: 'Iron & Mobility',
    },
    {
      name: 'EXCLUSIVE',
      slug: 'EXCLUSIVE',
      subtitle: 'Cookey Member Tokens, Physio & VIP Concession Passes',
      image: 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031774/bigchamp/images/exclusive.jpg',
      itemCount: 'VIP Only',
    },
  ];

  const configuredItems = sectionConfig?.items;
  const collections =
    Array.isArray(configuredItems) && configuredItems.length > 0
      ? configuredItems.map((item, idx) => ({
          name: item.title || defaultCollections[idx]?.name || 'COLLECTION',
          slug: item.title || defaultCollections[idx]?.slug || 'GEARS',
          subtitle: item.subtitle || defaultCollections[idx]?.subtitle || 'Certified sports gear',
          image: item.image || defaultCollections[idx]?.image || 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031778/bigchamp/images/gears.jpg',
          itemCount: item.badge || defaultCollections[idx]?.itemCount || 'Curated',
          link: item.link || `/store?category=${encodeURIComponent(item.title || 'GEARS')}`,
        }))
      : defaultCollections.map((col) => {
          const match = categories.find(
            (c) => c.name?.toUpperCase() === col.name || c.slug?.toUpperCase() === col.slug
          );
          return {
            ...col,
            name: match?.name || col.name,
            slug: match?.slug || col.slug,
            description: match?.description || col.subtitle,
          };
        });

  return (
    <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
      {/* Modern High-Impact Header */}
      <div className="scroll-header flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-white/10 gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-500 block">
            CORE DISCIPLINES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-display mt-1">
            Shop by Collection
          </h2>
        </div>
        <p className="text-sm text-slate-400 max-w-md">
          Explore specialized high-performance athletic categories engineered for competitive match play and athletic rigor.
        </p>
      </div>

      {/* Ultra-Wide 4-Card Luxury Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {collections.map((item) => (
          <Card3DTilt key={item.slug} maxTilt={7} scale={1.02} glare={true} data-scroll-card className="scroll-card rounded-2xl overflow-hidden">
            <Link
              to={`/store?category=${encodeURIComponent(item.slug)}`}
              className="group relative block h-[460px] sm:h-[500px] rounded-2xl overflow-hidden focus:outline-none"
            >
              {/* Full Background Media with Smooth Zoom */}
              <img
                src={item.image}
                alt={item.name}
                data-scroll-image
                className="scroll-image absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/collections/gears.jpg';
                }}
              />

              {/* Multi-layered Vignette & Dark Contrast Scrims */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/5 transition-colors pointer-events-none" />

              {/* Floating Top Badge */}
              <div
                className="absolute top-5 left-5 z-20 transform-gpu"
                style={{ transform: 'translateZ(24px)' }}
              >
                <span className="bg-slate-950/80 backdrop-blur-md text-amber-400 text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full border border-amber-500/30 shadow-lg flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {item.itemCount}
                </span>
              </div>

              {/* Floating Top-Right Arrow Action */}
              <div
                className="absolute top-5 right-5 z-20 transform-gpu"
                style={{ transform: 'translateZ(24px)' }}
              >
                <div className="w-10 h-10 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:border-amber-400 transition-all duration-300 shadow-lg">
                  <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>

              {/* Bottom Metadata Floating in 3D Depth */}
              <div
                className="absolute bottom-0 inset-x-0 p-7 z-20 space-y-2 transform-gpu"
                style={{ transform: 'translateZ(28px)' }}
              >
                <h3 className="text-3xl font-black text-white font-display tracking-tight group-hover:text-amber-400 transition-colors uppercase">
                  {item.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                  {item.subtitle}
                </p>
                <div className="pt-2 flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-400 group-hover:underline">
                  <span>Explore Discipline</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </Link>
          </Card3DTilt>
        ))}
      </div>
    </section>
  );
}

export default CategoryPillsStrip;
