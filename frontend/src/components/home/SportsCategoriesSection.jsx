import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Layers } from 'lucide-react';
import api from '../../services/api';

const CATEGORY_VISUALS = {
  GEARS: {
    title: 'Cricket & Team Sports',
    subtitle: 'MATCH-GRADE EQUIPMENT',
    description: 'Certified English Willow, four-piece leather balls, and tournament equipment.',
    image: 'https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?w=900&auto=format&fit=crop&q=80',
    fallbackImage: '/images/collections/gears.jpg',
    badge: 'Tournament Approved',
  },
  APPAREL: {
    title: 'Performance Apparel & Shoes',
    subtitle: 'ENGINEERED ACTIVEWEAR',
    description: 'High-velocity running spikes, dry-fit jerseys, and thermal compression wear.',
    image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=900&auto=format&fit=crop&q=80',
    fallbackImage: '/images/collections/apparel.jpg',
    badge: 'Pro Fit',
  },
  FITNESS: {
    title: 'Gym & Athletic Conditioning',
    subtitle: 'STRENGTH & RECOVERY',
    description: 'Eco-grip mats, cast iron dumbbells, speed skipping ropes, and recovery foam.',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=900&auto=format&fit=crop&q=80',
    fallbackImage: '/images/collections/fitness.jpg',
    badge: 'High Durability',
  },
  EXCLUSIVE: {
    title: 'VIP Pass & Exclusives',
    subtitle: 'MEMBER PRIVILEGES',
    description: 'Digital pass perks, Cookey tokens, and priority access to limited edition drops.',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=900&auto=format&fit=crop&q=80',
    fallbackImage: '/images/collections/exclusive.jpg',
    badge: 'Members Only',
  },
  EQUIPMENT: {
    title: 'Field & Tournament Gear',
    subtitle: 'PRECISION TRAINING',
    description: 'Agility ladders, boundary markers, coaching kits, and stadium accessories.',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&auto=format&fit=crop&q=80',
    fallbackImage: '/images/collections/gears.jpg',
    badge: 'Club Ready',
  },
};

export function SportsCategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/categories')
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          const activeCats = res.data.filter((c) => c.active !== false);
          setCategories(activeCats);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCategories([
            { slug: 'gears', name: 'GEARS', product_count: 5 },
            { slug: 'apparel', name: 'APPAREL', product_count: 6 },
            { slug: 'fitness', name: 'FITNESS', product_count: 3 },
            { slug: 'exclusive', name: 'EXCLUSIVE', product_count: 1 },
          ]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
      {/* Editorial Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5" />
            <span>Curated Disciplines</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
            Shop by Sport Category
          </h2>
          <p className="text-sm text-slate-300 max-w-xl">
            Explore authentic tournament equipment, performance footwear, and athletic wear engineered for champions.
          </p>
        </div>

        <Link
          to="/store"
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest group"
        >
          <span>View All Catalog Products</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Dynamic Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat, idx) => {
          const key = (cat.slug || cat.name || '').toUpperCase();
          const visual = CATEGORY_VISUALS[key] || {
            title: cat.name || key,
            subtitle: 'ATHLETIC COLLECTION',
            description: cat.description || 'Premium gear certified for match rigor.',
            image: '/images/collections/gears.jpg',
            fallbackImage: '/images/collections/gears.jpg',
            badge: 'Certified',
          };

          return (
            <Link
              key={cat._id || cat.id || idx}
              to={`/store?category=${encodeURIComponent(key)}`}
              className="group relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 hover:border-cyan-400/50 transition-all duration-500 flex flex-col justify-between min-h-[380px] shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1"
            >
              {/* Category Background Image */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                  src={visual.image}
                  alt={visual.title}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out opacity-60 group-hover:opacity-75"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = visual.fallbackImage || '/images/collections/gears.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
              </div>

              {/* Card Top: Badges & Product Count */}
              <div className="relative z-10 p-6 flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                  {visual.badge}
                </span>

                {cat.product_count !== undefined && (
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[11px] font-mono font-bold">
                    {cat.product_count} items
                  </span>
                )}
              </div>

              {/* Card Bottom: Content & CTA with Frosted Backplate */}
              <div className="relative z-10 p-6 space-y-2 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent backdrop-blur-xs rounded-b-3xl">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400 block font-bold">
                  {visual.subtitle}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white font-display leading-tight group-hover:text-cyan-400 transition-colors drop-shadow-md">
                  {visual.title}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed drop-shadow-sm">
                  {visual.description}
                </p>

                <div className="pt-3 flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-cyan-400" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default SportsCategoriesSection;

