import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Tag, Package } from 'lucide-react';
import api from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export function FeaturedProductsSection({ content }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.get('/products?featured=true&limit=4')
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
  }, []);

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent-700">Official Store</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {content?.heading || 'Featured Sports Gear'}
          </h2>
        </div>
        <Link to={content?.cta_link || '/store'}>
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
            {content?.cta_text || 'View All Products'}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="p-4 animate-pulse space-y-3">
              <div className="w-full aspect-square bg-slate-200 rounded-lg" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => {
            const price = (p.price_paise || 0) / 100;
            const memberPrice = (p.member_price_paise || 0) / 100;

            return (
              <Card key={p._id || p.slug} className="p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-200 group">
                <div className="space-y-3">
                  <div className="w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
                    <Package className="w-12 h-12 text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {p.category} &bull; {p.sport}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1">{p.name}</h3>
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
                      Details
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default FeaturedProductsSection;
