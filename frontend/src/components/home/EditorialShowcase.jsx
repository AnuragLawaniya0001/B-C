import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card3DTilt } from '../3d/Card3DTilt';

const defaultEditorialItems = [
  {
    title: 'Match-Day Excellence.',
    tag: 'CRAFTED FOR PLAY',
    description: 'English willow bats, certified leather balls, and tournament equipment.',
    linkText: 'Shop Best Sellers',
    link: '/store?category=GEARS',
    image: 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031783/bigchamp/images/story_cricket.jpg',
  },
  {
    title: 'Wear Your Ambition.',
    tag: 'PRO RECOVERY & SPEED',
    description: 'Technical dry-fit jerseys, moisture-wicking compression, and velocity footwear.',
    linkText: 'Wear Your Story',
    link: '/store?category=APPAREL',
    image: 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031786/bigchamp/images/story_speed.jpg',
  },
  {
    title: 'Athletic Wellness.',
    tag: 'PURE CONDITIONING',
    description: 'Premium eco grip yoga mats, cast iron dumbbells, and high-speed bearing ropes.',
    linkText: 'Complete Athletic Care',
    link: '/store?category=FITNESS',
    image: 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031784/bigchamp/images/story_fitness.jpg',
  },
];

export function EditorialShowcase({ sectionConfig }) {
  const configuredItems = sectionConfig?.items;
  const editorialItems =
    Array.isArray(configuredItems) && configuredItems.length > 0
      ? configuredItems.map((item, idx) => ({
          title: item.title || defaultEditorialItems[idx]?.title || 'Match Excellence',
          tag: item.tag || item.badge || defaultEditorialItems[idx]?.tag || 'CRAFTED FOR SPORT',
          description: item.subtitle || defaultEditorialItems[idx]?.description || '',
          linkText: item.link_text || defaultEditorialItems[idx]?.linkText || 'Explore',
          link: item.link || defaultEditorialItems[idx]?.link || '/store',
          image: item.image || defaultEditorialItems[idx]?.image || 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031788/bigchamp/images/hero_main.jpg',
        }))
      : defaultEditorialItems;

  return (
    <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-12 perspective-1400">
      {/* Modern High-Impact Header */}
      <div className="scroll-header flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-white/10 gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-500 block">
            THE EDITORIAL DISPATCH
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-display mt-1">
            Crafted for Victory
          </h2>
        </div>
        <p className="text-sm text-slate-400 max-w-md">
          Behind the materials, engineering, and craftsmanship that empower India's competitive athletes.
        </p>
      </div>

      {/* 3-Column Luxury Storytelling Cards with Dynamic 3D Glare */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {editorialItems.map((item, idx) => (
          <Card3DTilt
            key={idx}
            maxTilt={7}
            scale={1.02}
            className="scroll-card rounded-2xl overflow-hidden"
            data-scroll-card
          >
            <div className="group relative h-[520px] sm:h-[580px] rounded-2xl overflow-hidden flex flex-col justify-end p-8 sm:p-10 text-white">
              {/* Background Editorial Image with Scale Dynamics */}
              <img
                src={item.image}
                alt={item.title}
                data-scroll-image
                className="scroll-image absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/hero/hero_main.jpg';
                }}
              />

              {/* Dynamic Contrast Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/5 transition-colors" />

              {/* Content Container Floating in 3D Depth */}
              <div
                className="relative z-10 space-y-3 transform-gpu"
                style={{ transform: 'translateZ(26px)' }}
              >
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-400 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-amber-500/30 inline-block shadow-lg">
                  {item.tag}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white drop-shadow-md">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="pt-2">
                  <Link
                    to={item.link}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:text-amber-400 transition-colors border-b-2 border-amber-500 pb-1"
                  >
                    {item.linkText} <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </Card3DTilt>
        ))}
      </div>
    </section>
  );
}

export default EditorialShowcase;
