import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import api from '../../services/api';
import { ProductCard } from '../../components/product/ProductCard';
import { Button } from '../../components/ui/Button';

const PAGE_SIZE = 12;

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

  const [categories, setCategories] = useState(['ALL']);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    api.get('/categories')
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          const catNames = [
            'ALL',
            ...res.data.filter((c) => c.active !== false).map((c) => c.name || c.slug),
          ];
          setCategories(Array.from(new Set(catNames)));
        }
      })
      .catch(() => {
        if (isMounted) {
          setCategories(['ALL', 'GEARS', 'APPAREL', 'EXCLUSIVE', 'FITNESS']);
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

    api.get(`/products?${params.toString()}`)
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
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters =
    categoryFilter !== 'ALL' || !!searchInput.trim() || !!sortOrder;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Link to="/" className="hover:text-primary-900">
            Home
          </Link>
          <span>/</span>
          <span className="text-primary-900">Official Catalog</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
              Sports Gear & Equipment
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Explore authentic equipment, certified apparel, and member privileges.
            </p>
          </div>

          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full shrink-0 self-start sm:self-auto">
            {products.length} Products Available
          </span>
        </div>
      </div>

      {/* Search & Sort Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md"
          >
            <input
              type="text"
              placeholder="Search by product name, sport, or SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateFilters({ search: '', page: 1 });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Sort:
            </span>
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  updateFilters({ sort: e.target.value, page: 1 });
                }}
                className="appearance-none pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                <option value="">Featured / Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Categories:
          </span>
          {categories.map((cat) => {
            const isSelected =
              categoryFilter.toUpperCase() === cat.toUpperCase();
            return (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  updateFilters({ category: cat, page: 1 });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-primary-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-500">Active filters:</span>
            {categoryFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-900 border border-primary-200">
                Category: {categoryFilter}
                <button
                  onClick={() => {
                    setCategoryFilter('ALL');
                    updateFilters({ category: 'ALL', page: 1 });
                  }}
                  className="hover:text-primary-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchInput && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-900 border border-primary-200">
                Search: "{searchInput}"
                <button
                  onClick={() => {
                    setSearchInput('');
                    updateFilters({ search: '', page: 1 });
                  }}
                  className="hover:text-primary-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {sortOrder && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-900 border border-primary-200">
                Sorted: {sortOrder.replace('_', ' ')}
                <button
                  onClick={() => {
                    setSortOrder('');
                    updateFilters({ sort: '', page: 1 });
                  }}
                  className="hover:text-primary-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-red-600 hover:text-red-700 ml-2"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Product Grid Area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse space-y-3"
            >
              <div className="w-full aspect-square bg-slate-200 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-8 text-center space-y-3">
          <p className="font-semibold text-sm">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateFilters({ page: 1 })}
          >
            Retry Loading
          </Button>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id || product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No matching gear found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't find any products matching your active filters. Try adjusting your search term or category.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearFilters}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Pagination Controls */}
      {products.length > 0 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500">
            Page {currentPage} (Showing up to {PAGE_SIZE} products per page)
          </p>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => {
                const prev = Math.max(1, currentPage - 1);
                setCurrentPage(prev);
                updateFilters({ page: prev });
              }}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={products.length < PAGE_SIZE}
              onClick={() => {
                const next = currentPage + 1;
                setCurrentPage(next);
                updateFilters({ page: next });
              }}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
