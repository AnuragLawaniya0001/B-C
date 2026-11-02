import React from 'react';

export function SportsMarquee() {
  const items = [
    'CRICKET',
    'FOOTBALL',
    'FITNESS',
    'FOOTWEAR',
    'APPAREL',
    'SPORTS LIFESTYLE',
  ];

  return (
    <div className="w-full bg-slate-950 border-y border-white/10 py-4 overflow-hidden relative select-none">
      <div className="flex items-center whitespace-nowrap animate-ticker">
        {/* Copy 1 */}
        {items.map((item, idx) => (
          <div key={`m1-${idx}`} className="inline-flex items-center mx-6 sm:mx-10 group">
            <span className="text-sm sm:text-base font-black tracking-[0.35em] text-slate-300 font-display group-hover:text-amber-400 transition-colors">
              {item}
            </span>
            <span className="ml-6 sm:ml-10 text-amber-500 font-mono text-xs">✦</span>
          </div>
        ))}

        {/* Copy 2 for seamless loop */}
        {items.map((item, idx) => (
          <div key={`m2-${idx}`} className="inline-flex items-center mx-6 sm:mx-10 group">
            <span className="text-sm sm:text-base font-black tracking-[0.35em] text-slate-300 font-display group-hover:text-amber-400 transition-colors">
              {item}
            </span>
            <span className="ml-6 sm:ml-10 text-amber-500 font-mono text-xs">✦</span>
          </div>
        ))}

        {/* Copy 3 for ultra-wide screens */}
        {items.map((item, idx) => (
          <div key={`m3-${idx}`} className="inline-flex items-center mx-6 sm:mx-10 group">
            <span className="text-sm sm:text-base font-black tracking-[0.35em] text-slate-300 font-display group-hover:text-amber-400 transition-colors">
              {item}
            </span>
            <span className="ml-6 sm:ml-10 text-amber-500 font-mono text-xs">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SportsMarquee;

