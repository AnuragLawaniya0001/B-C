import React from 'react';
import { Outlet } from 'react-router-dom';
import StorefrontHeader from '../components/navigation/StorefrontHeader';
import StorefrontFooter from '../components/navigation/StorefrontFooter';

export function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-accent-500 selection:text-white">
      <StorefrontHeader />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <StorefrontFooter />
    </div>
  );
}

export default StorefrontLayout;
