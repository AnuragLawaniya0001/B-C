import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const url = categoryFilter === 'ALL' ? '/products' : `/products?category=${categoryFilter}`;

    api.get(url)
      .then((res) => {
        if (isMounted) {
          setProducts(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {
        if (isMounted) setProducts([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [categoryFilter]);

  const categories = ['ALL', 'GEARS', 'APPAREL', 'EXCLUSIVE'];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bigchamp Store</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Authentic sports equipment, apparel, athletic essentials, and exclusive Cookey products.
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mt-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                categoryFilter === cat
                  ? 'bg-primary-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Products' : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <Card key={n} className="p-4 animate-pulse space-y-3">
              <div className="w-full aspect-square bg-slate-200 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => {
            const price = (p.price_paise || 0) / 100;
            const memberPrice = (p.member_price_paise || 0) / 100;

            return (
              <Card key={p._id || p.slug} className="p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-200 group">
                <div className="space-y-3">
                  <div className="w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform relative overflow-hidden">
                    <Package className="w-12 h-12 text-slate-400" />
                    {p.is_cookey && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3" /> Exclusive
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {p.category} &bull; {p.sport}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1">{p.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{p.description}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 line-through">₹{price}</p>
                    <p className="text-base font-extrabold text-slate-900 flex items-center gap-1">
                      ₹{memberPrice} <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">Member</span>
                    </p>
                  </div>
                  <Link to={`/store/product/${p.slug}`}>
                    <Button variant="secondary" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500">
          <p className="text-base font-semibold">No products found in this category.</p>
        </div>
      )}
    </div>
  );
}
