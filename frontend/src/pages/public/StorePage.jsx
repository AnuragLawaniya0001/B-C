import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ShoppingBag,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Sparkles,
  Flame,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';
import { ProductCard } from '../../components/product/ProductCard';
import { Button } from '../../components/ui/Button';

const PAGE_SIZE = 12;

const CATEGORY_ICONS = {
  ALL: '🛍️',
  GEARS: '🏏',
  APPAREL: '👕',
  FITNESS: '🏋️',
  EXCLUSIVE: '🎟️',
  EQUIPMENT: '⚽',
};

const PROMO_SLIDES = [
  {
    title: 'Match-Ready Cricket Equipment',
    subtitle: 'ENGLISH WILLOW & TOURNAMENT BALLS',
    description: 'Certified Grade 1 willow bats, tournament balls, and professional batting armor tested by top coaches.',
    badge: 'NEW SEASON 2026',
    badgeColor: 'bg-cyan-400 text-slate-950',
    linkCategory: 'GEARS',
    cta: 'Shop Cricket Gear',
    bgGradient: 'from-cyan-950/60 via-slate-900 to-slate-950',
    borderColor: 'border-cyan-500/30',
  },
  {
    title: 'High-Performance Apparel & Footwear',
    subtitle: 'RUNNING SPIKES & ATHLETIC WEAR',
    description: 'Kinetic-engineered running shoes and breathable athletic jerseys designed for extreme training drills.',
    badge: 'UP TO 35% OFF',
    badgeColor: 'bg-emerald-400 text-slate-950',
    linkCategory: 'APPAREL',
    cta: 'Shop Footwear & Wear',
    bgGradient: 'from-emerald-950/60 via-slate-900 to-slate-950',
    borderColor: 'border-emerald-500/30',
  },
  {
    title: 'VIP Athlete Pass — Extra 15% Off',
    subtitle: 'MEMBERS-ONLY PRICING',
    description: 'Get member privileges: flat 15% off across every item in the catalog, priority drops, and free shipping.',
    badge: 'PASS PRIVILEGE',
    badgeColor: 'bg-purple-400 text-slate-950',
    linkPath: '/membership',
    cta: 'Unlock VIP Member Pass',
    bgGradient: 'from-purple-950/60 via-slate-900 to-slate-950',
    borderColor: 'border-purple-500/30',
  },
];

export default function StorePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Query state derived from URL
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialSort = searchParams.get('sort') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [sortOrder, setSortOrder] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [priceRange, setPriceRange] = useState('ALL');
  const [inStockOnly, setInStockOnly] = useState(false);

  const [categories, setCategories] = useState(['ALL']);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPromoIdx, setCurrentPromoIdx] = useState(0);

  // Auto-advance promotional banner every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromoIdx((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Sync internal state when URL search params change
  useEffect(() => {
    setSearchInput(searchParams.get('search') || '');
    setCategoryFilter(searchParams.get('category') || 'ALL');
    setSortOrder(searchParams.get('sort') || '');
    setCurrentPage(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  // Fetch categories on mount
  useEffect(() => {
    let isMounted = true;
    api
      .get('/categories')
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          const catNames = [
            'ALL',
            ...res.data.filter((c) => c.active !== false).map((c) => (c.name || c.slug).toUpperCase()),
          ];
          setCategories(Array.from(new Set(catNames)));
        }
      })
      .catch(() => {
        if (isMounted) {
          setCategories(['ALL', 'GEARS', 'APPAREL', 'FITNESS', 'EXCLUSIVE']);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update URL helper
  const updateFilters = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (!val || val === 'ALL' || (key === 'page' && val === 1)) {
        updated.delete(key);
      } else {
        updated.set(key, val);
      }
    });
    setSearchParams(updated);
  };

  // Fetch products based on filters
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const skip = (currentPage - 1) * PAGE_SIZE;
    const params = new URLSearchParams();
    params.set('active', 'true');
    params.set('skip', skip.toString());
    params.set('limit', PAGE_SIZE.toString());

    if (categoryFilter && categoryFilter.toUpperCase() !== 'ALL') {
      params.set('category', categoryFilter.toUpperCase());
    }
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    }
    if (sortOrder) {
      params.set('sort', sortOrder);
    }

    api
      .get(`/products?${params.toString()}`)
      .then((res) => {
        if (isMounted) {
          setProducts(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch catalog products');
          setProducts([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [categoryFilter, searchInput, sortOrder, currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim(), page: 1 });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setCategoryFilter('ALL');
    setSortOrder('');
    setPriceRange('ALL');
    setInStockOnly(false);
    setCurrentPage(1);
    setSearchParams({});
  };

  // Client-side filtering for priceRange and inStockOnly
  const displayedProducts = useMemo(() => {
    return products.filter((p) => {
      const price = (p.price_paise || 0) / 100;
      if (priceRange === 'UNDER_1000' && price >= 1000) return false;
      if (priceRange === '1000_3000' && (price < 1000 || price > 3000)) return false;
      if (priceRange === '3000_5000' && (price < 3000 || price > 5000)) return false;
      if (priceRange === 'ABOVE_5000' && price <= 5000) return false;

      if (inStockOnly && p.stock !== undefined && p.stock <= 0) return false;

      return true;
    });
  }, [products, priceRange, inStockOnly]);

  const hasActiveFilters =
    categoryFilter !== 'ALL' ||
    !!searchInput.trim() ||
    !!sortOrder ||
    priceRange !== 'ALL' ||
    inStockOnly;

  const activePromo = PROMO_SLIDES[currentPromoIdx];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Cinematic Story Access Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shrink-0">
            🎬
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-white block font-display">
              The Cinematic Experience: Birth of a Legend
            </span>
            <span className="text-[11px] text-slate-400">
              Interactive 8-scene scroll story of the English Willow cricket bat from raw cleft to tournament climax.
            </span>
          </div>
        </div>
        <Link
          to="/store"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-cyan-500/20"
        >
          <span>Watch Film &bull; Shop Bat</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 1. SHOPPING HERO DEALS BANNER CAROUSEL */}
      <div className={`relative rounded-3xl bg-gradient-to-r ${activePromo.bgGradient} border ${activePromo.borderColor} p-6 sm:p-10 overflow-hidden shadow-2xl transition-all duration-700`}>
        <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${activePromo.badgeColor}`}>
              {activePromo.badge}
            </span>
            <span className="text-xs font-bold text-cyan-400 tracking-wider">
              {activePromo.subtitle}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-display">
            {activePromo.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            {activePromo.description}
          </p>

          <div className="pt-2 flex items-center gap-3">
            {activePromo.linkCategory ? (
              <button
                onClick={() => {
                  setCategoryFilter(activePromo.linkCategory);
                  updateFilters({ category: activePromo.linkCategory, page: 1 });
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{activePromo.cta}</span>
              </button>
            ) : (
              <Link
                to={activePromo.linkPath}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-cyan-500/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{activePromo.cta}</span>
              </Link>
            )}

            {/* Slider Dots */}
            <div className="flex items-center gap-1.5 ml-4">
              {PROMO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPromoIdx(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${currentPromoIdx === idx
                      ? 'w-6 bg-cyan-400'
                      : 'bg-white/20 hover:bg-white/40'
                    }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY QUICK-BROWSER PILLS WITH ICONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>Browse By Category</span>
          </h3>
          <span className="text-xs text-slate-400">
            {categories.length - 1} Sporting Categories
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const isSelected = categoryFilter.toUpperCase() === cat.toUpperCase();
            const icon = CATEGORY_ICONS[cat.toUpperCase()] || '🎯';
            return (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  updateFilters({ category: cat, page: 1 });
                }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-500/10 text-white ring-1 ring-cyan-400/40'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                  }`}
              >
                <span className="text-2xl p-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  {icon}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-xs uppercase tracking-wider truncate">
                    {cat === 'ALL' ? 'All Gear' : cat}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isSelected ? 'Selected' : 'Shop category'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SEARCH & ADVANCED FILTER COMMAND CENTER */}
      <div className="bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Keyword Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xl">
            <input
              type="text"
              placeholder="Search gear by name, sport (cricket, football, shoes), or SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-950 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white placeholder-slate-400 shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateFilters({ search: '', page: 1 });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Quick Filter Controls: Price Range & In-Stock & Sort */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Price Filter Dropdown */}
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-700/80 outline-none hover:border-slate-600 transition-colors cursor-pointer"
            >
              <option value="ALL">All Prices</option>
              <option value="UNDER_1000">Under ₹1,000</option>
              <option value="1000_3000">₹1,000 - ₹3,000</option>
              <option value="3000_5000">₹3,000 - ₹5,000</option>
              <option value="ABOVE_5000">Above ₹5,000</option>
            </select>

            {/* In-Stock Only Button */}
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${inStockOnly
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-slate-950 border-slate-700/80 text-slate-400 hover:text-white'
                }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>In Stock Only</span>
            </button>

            {/* Sort Order Dropdown */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  updateFilters({ sort: e.target.value, page: 1 });
                }}
                className="appearance-none pl-3 pr-8 py-2.5 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="">Featured / Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filters Summary Ribbon */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Applied filters:</span>

            {categoryFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold">
                Category: {categoryFilter}
                <button
                  onClick={() => {
                    setCategoryFilter('ALL');
                    updateFilters({ category: 'ALL', page: 1 });
                  }}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchInput && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold">
                Search: "{searchInput}"
                <button
                  onClick={() => {
                    setSearchInput('');
                    updateFilters({ search: '', page: 1 });
                  }}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {priceRange !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700 font-medium">
                Price: {priceRange.replace('_', ' ')}
                <button onClick={() => setPriceRange('ALL')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                In Stock
                <button onClick={() => setInStockOnly(false)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {sortOrder && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700 font-medium">
                Sort: {sortOrder.replace('_', ' ')}
                <button
                  onClick={() => {
                    setSortOrder('');
                    updateFilters({ sort: '', page: 1 });
                  }}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 ml-2 cursor-pointer underline"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* 4. PRODUCT GRID STATUS HEADER */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Showing{' '}
          <span className="text-white font-bold">{displayedProducts.length}</span>{' '}
          items{' '}
          {categoryFilter !== 'ALL' && <span>in <strong className="text-cyan-400">{categoryFilter}</strong></span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Store Inventory</span>
        </div>
      </div>

      {/* 5. PRODUCT CARDS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 animate-pulse space-y-3"
            >
              <div className="w-full aspect-square bg-slate-800 rounded-xl" />
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-800/60 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-8 text-center space-y-4">
          <p className="text-rose-400 text-sm font-semibold">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
          >
            Retry Connection
          </Button>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="bg-slate-900/50 rounded-3xl p-12 text-center border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No products found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              We couldn't find any gear matching your active filters. Try resetting your search or exploring other sport categories.
            </p>
          </div>
          <button
            onClick={handleClearFilters}
            className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Show All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayedProducts.map((product) => (
            <ProductCard key={product._id || product.id} product={product} />
          ))}
        </div>
      )}

      {/* 6. PAGINATION */}
      {products.length === PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <Button
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => {
              const prev = Math.max(1, currentPage - 1);
              setCurrentPage(prev);
              updateFilters({ page: prev });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-slate-900 border-slate-700 text-slate-200"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <span className="text-xs font-bold text-slate-400 px-3">
            Page {currentPage}
          </span>
          <Button
            variant="outline"
            onClick={() => {
              const next = currentPage + 1;
              setCurrentPage(next);
              updateFilters({ page: next });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-slate-900 border-slate-700 text-slate-200"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* 7. E-COMMERCE ASSURANCE RIBBON */}
      <div className="pt-8 border-t border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">100% Genuine Certified</div>
              <div className="text-[11px] text-slate-400">Match willow, balls & equipment</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Free Insured Delivery</div>
              <div className="text-[11px] text-slate-400">On all sports orders above ₹500</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">7-Day Easy Exchange</div>
              <div className="text-[11px] text-slate-400">Size & spec replacement across India</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
