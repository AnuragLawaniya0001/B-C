import React from 'react';
import { Outlet } from 'react-router-dom';
import LandingHeader from '../navigation/LandingHeader';
import LandingFooter from '../navigation/LandingFooter';
import { useLenisScroll } from '../../hooks/useLenisScroll';

export function LandingLayout() {
  useLenisScroll();

  return (
    <div className="relative min-h-screen flex flex-col bg-[#02050b] text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      {/* Atmospheric Contrast & Ambient Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 25%, rgba(245, 158, 11, 0.08) 0%, transparent 55%), radial-gradient(circle at 50% 50%, transparent 40%, rgba(2, 5, 11, 0.6) 80%, rgba(1, 3, 8, 0.96) 100%)',
        }}
      />

      {/* Corporate Landing Header */}
      <LandingHeader />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col pt-24 sm:pt-28">
        <Outlet />
      </main>

      {/* Corporate Landing Footer */}
      <div className="relative z-10">
        <LandingFooter />
      </div>
    </div>
  );
}

export default LandingLayout;
