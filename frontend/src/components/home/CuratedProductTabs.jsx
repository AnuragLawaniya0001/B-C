import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, ShoppingBag, Check } from 'lucide-react';
import { ProductCard } from '../product/ProductCard';

const CATEGORY_LABELS = {
  ALL: 'All Equipment',
  GEARS: 'Match Gears',
  APPAREL: 'Footwear & Apparel',
  FITNESS: 'Gym & Fitness',
  EXCLUSIVE: 'Exclusive Passes',
  EQUIPMENT: 'Match Equipment',
};

export function CuratedProductTabs({ sectionConfig, products = [], loading = false }) {
  const [activeTab, setActiveTab] = useState('ALL');

  // Title and narrative driven by admin storefront merchandising
  const headline = sectionConfig?.title || "See What's New Today";
  const subtitle = sectionConfig?.subtitle || 'ELEVATE YOUR PERFORMANCE';

  // Determine curated products
  const curatedProducts = useMemo(() => {
    const selectedIds = sectionConfig?.product_ids || sectionConfig?.config?.product_ids;
    if (Array.isArray(selectedIds) && selectedIds.length > 0) {
      const idSet = new Set(selectedIds.map(String));
      const filtered = products.filter(
        (p) => idSet.has(String(p._id)) || idSet.has(String(p.id)) || idSet.has(String(p.slug))
      );
      // If matches found, use curated selection. Otherwise gracefully fallback to catalogue.
      if (filtered.length > 0) return filtered;
    }
    return products;
  }, [products, sectionConfig]);

  // Determine tabs
  const tabs = useMemo(() => {
    const configuredTabs = sectionConfig?.config?.tabs;
    if (Array.isArray(configuredTabs) && configuredTabs.length > 0) {
      return configuredTabs.map((t) => ({
        id: t.toUpperCase(),
        label: CATEGORY_LABELS[t.toUpperCase()] || t,
      }));
    }
    // Dynamic fallback based on products present
    const distinctCats = Array.from(
      new Set(curatedProducts.map((p) => p.category?.toUpperCase()).filter(Boolean))
    );
    const result = [{ id: 'ALL', label: 'All Equipment' }];
    distinctCats.forEach((c) => {
      result.push({
        id: c,
        label: CATEGORY_LABELS[c] || c,
      });
    });
    return result;
  }, [curatedProducts, sectionConfig]);

  // Filter products by active tab
  const filteredProducts = useMemo(() => {
    if (activeTab === 'ALL') return curatedProducts;
    return curatedProducts.filter(
      (p) =>
        p.category?.toUpperCase() === activeTab ||
        p.sport?.toUpperCase() === activeTab ||
        p.category_slug?.toUpperCase() === activeTab
    );
  }, [curatedProducts, activeTab]);

  return (
    <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-12">
      {/* Editorial Title */}
      <div className="scroll-header flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-white/10 gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-500 block">
            {subtitle}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-display mt-1">
            {headline}
          </h2>
        </div>
        <p className="text-sm text-slate-400 max-w-md">
          Hand-picked match equipment, certified athletic gear, and performance apparel tested for champions.
        </p>
      </div>

      {/* Filter Tabs */}
      {tabs.length > 1 && (
        <div className="scroll-header flex items-center justify-start gap-2.5 sm:gap-3 flex-wrap mb-10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105 border border-amber-400'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Product Grid - Full Bleed 6-Column Canvas */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
            <div key={n} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 animate-pulse space-y-3">
              <div className="w-full aspect-square bg-slate-800 rounded-xl" />
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {filteredProducts.slice(0, 12).map((product) => (
            <ProductCard key={product._id || product.id || product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800 p-8">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No products found in this category tab</h3>
          <p className="text-xs text-slate-400 mt-1">Explore our complete store catalogue to discover all equipment.</p>
          <Link
            to="/store"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-amber-500 hover:underline"
          >
            Explore Complete Store <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* View All Store Link */}
      <div className="text-center mt-12">
        <Link
          to="/store"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-slate-900 border border-slate-700 text-white font-bold text-sm hover:border-amber-500 hover:text-amber-400 transition-all shadow-lg hover:shadow-amber-500/20"
        >
          View All {products.length} Products in Store <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
