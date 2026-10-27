import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import StorefrontHeader from '../navigation/StorefrontHeader';
import StorefrontFooter from '../navigation/StorefrontFooter';
import { PromotionalPopupModal } from '../promotions/PromotionalPopupModal';
import { KineticScene3D } from '../3d/KineticScene3D';
import { ScrollProgress3D } from '../3d/ScrollProgress3D';
import { useLenisScroll } from '../../hooks/useLenisScroll';

export function PublicLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // Initialize butter-smooth inertial scroll for 3D physics
  useLenisScroll();

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* 3D Glowing Scroll Progress Tracker */}
      <ScrollProgress3D />

      {/* Interactive 3D WebGL Background Scene */}
      <KineticScene3D />

      {/* Navigation Header with transparent video overlay */}
      <StorefrontHeader />

      {/* Main Content Area */}
      <main className={`relative z-10 flex-1 flex flex-col ${isHomePage ? 'pt-0' : 'pt-28 sm:pt-32'}`}>
        <Outlet />
      </main>

      <div className="relative z-10">
        <StorefrontFooter />
      </div>

      <PromotionalPopupModal />
    </div>
  );
}

export default PublicLayout;
