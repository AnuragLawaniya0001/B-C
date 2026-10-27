import React from 'react';
import { Instagram, ArrowUpRight } from 'lucide-react';
import { Card3DTilt } from '../3d/Card3DTilt';

const defaultPhotos = [
  {
    image: 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031786/bigchamp/images/story_speed.jpg',
    tag: '#ChampionRunner',
    sport: 'Marathon 42K',
  },
  {
    image: 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031783/bigchamp/images/story_cricket.jpg',
    tag: '#MatchDayGear',
    sport: 'Willow Cricket',
  },
  {
    image: 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031784/bigchamp/images/story_fitness.jpg',
    tag: '#AthleticConditioning',
    sport: 'Strength Gym',
  },
  {
    image: 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031778/bigchamp/images/gears.jpg',
    tag: '#SpeedVelocity',
    sport: 'Track & Sprint',
  },
  {
    image: 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031773/bigchamp/images/apparel.jpg',
    tag: '#TournamentTested',
    sport: 'Team Sports',
  },
  {
    image: 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031776/bigchamp/images/fitness.jpg',
    tag: '#BigChampStyle',
    sport: 'Performance Wear',
  },
];

export function CommunityPhotoGrid({ sectionConfig }) {
  const configuredItems = sectionConfig?.items;
  const photos =
    Array.isArray(configuredItems) && configuredItems.length > 0
      ? configuredItems.map((item, idx) => ({
          image: item.image || defaultPhotos[idx]?.image || 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031788/bigchamp/images/hero_main.jpg',
          tag: item.title || defaultPhotos[idx]?.tag || '#BIGCHAMP',
          sport: item.subtitle || defaultPhotos[idx]?.sport || 'Pro Sport',
        }))
      : defaultPhotos;

  return (
    <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-12">
      {/* Editorial Title */}
      <div className="scroll-header flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-white/10 gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-500 block">
            COMMUNITY & SPONSORSHIPS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-display mt-1">
            Athlete Verified Arena
          </h2>
        </div>
        <p className="text-sm text-slate-400 max-w-md">
          Tag @bigchamp.sports to be featured across our national community network.
        </p>
      </div>

      {/* 6-Photo Responsive Ultra-Wide Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
        {photos.map((item, idx) => (
          <Card3DTilt key={idx} maxTilt={8} scale={1.03} glare={true} data-scroll-card className="scroll-card rounded-2xl overflow-hidden">
            <div className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg">
              <img
                src={item.image}
                alt={item.tag}
                data-scroll-image
                className="scroll-image w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/hero/hero_main.jpg';
                }}
              />

              {/* Hover Instagram Overlay */}
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-white text-center">
                <Instagram className="w-6 h-6 text-amber-400 mb-2 transform group-hover:-translate-y-1 transition-transform" />
                <p className="text-xs font-black tracking-wide text-white">{item.tag}</p>
                <p className="text-[11px] text-slate-300 mt-0.5">{item.sport}</p>
                <span className="mt-2.5 text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1 border-b border-amber-500/50 pb-0.5">
                  View Gear <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Card3DTilt>
        ))}
      </div>
    </section>
  );
}

export default CommunityPhotoGrid;
