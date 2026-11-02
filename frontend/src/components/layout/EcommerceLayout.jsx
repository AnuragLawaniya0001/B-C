import React from 'react';
import { Outlet } from 'react-router-dom';
import EcommerceHeader from '../navigation/EcommerceHeader';
import EcommerceFooter from '../navigation/EcommerceFooter';
import { PromotionalPopupModal } from '../promotions/PromotionalPopupModal';
import { KineticScene3D } from '../3d/KineticScene3D';
import { ScrollProgress3D } from '../3d/ScrollProgress3D';
import { useLenisScroll } from '../../hooks/useLenisScroll';

export function EcommerceLayout() {
  // Butter-smooth inertial scrolling
  useLenisScroll();

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* 3D Glowing Scroll Progress Tracker */}
      <ScrollProgress3D />

      {/* Interactive 3D WebGL Background Scene */}
      <KineticScene3D />

      {/* Pure E-Commerce Shopping Header */}
      <EcommerceHeader />

      {/* Main E-Commerce Content Area with offset for header */}
      <main className="relative z-10 flex-1 flex flex-col pt-24 sm:pt-28">
        <Outlet />
      </main>

      {/* Pure E-Commerce Footer */}
      <div className="relative z-10">
        <EcommerceFooter />
      </div>

      <PromotionalPopupModal />
    </div>
  );
}

export default EcommerceLayout;

