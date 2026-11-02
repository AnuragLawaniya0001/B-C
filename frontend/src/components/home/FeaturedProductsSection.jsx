import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Sparkles, Heart, Star, Check } from 'lucide-react';
import { Card3DTilt } from '../3d/Card3DTilt';
import { useCartStore } from '../../store/cartStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

export function FeaturedProductsSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [addingId, setAddingId] = useState(null);

  const { addItem } = useCartStore();

  useEffect(() => {
    // Load local wishlist
    try {
      const saved = JSON.parse(localStorage.getItem('bc_wishlist') || '[]');
      setWishlist(saved);
    } catch (e) {}

    let isMounted = true;
    api
      .get('/products?active=true&limit=8')
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          setProducts(res.data);
        }
      })
      .catch((err) => {
        console.error('Error fetching featured products:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleWishlist = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    let updated;
    if (wishlist.includes(productId)) {
      updated = wishlist.filter((id) => id !== productId);
      toast.success('Removed from wishlist');
    } else {
      updated = [...wishlist, productId];
      toast.success('Saved to wishlist', { icon: '❤️' });
    }
    setWishlist(updated);
    try {
      localStorage.setItem('bc_wishlist', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    setAddingId(product._id || product.id);
    addItem({
      _id: product._id || product.id,
      slug: product.slug,
      name: product.name,
      price_paise: product.price_paise,
      member_price_paise: product.member_price_paise,
      images: product.images || [],
      category: product.category,
      quantity: 1,
    });

    toast.success(`Added ${product.name} to cart!`, { icon: '🛍️' });

    setTimeout(() => {
      setAddingId(null);
    }, 600);
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tournament Roster</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
            Featured Match Equipment
          </h2>
          <p className="text-sm text-slate-400 max-w-xl">
            Match-tested tournament willow, high-velocity footwear, and precision training gear crafted for champions.
          </p>
        </div>

        <Link
          to="/store"
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest group"
        >
          <span>Explore Entire Catalog</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-slate-900/60 rounded-3xl p-4 border border-slate-800 animate-pulse space-y-3">
              <div className="w-full aspect-square bg-slate-800 rounded-2xl" />
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-800/60 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const pId = product._id || product.id;
            const price = (product.price_paise || 0) / 100;
            const compareAt = product.compare_at_price_paise
              ? product.compare_at_price_paise / 100
              : null;
            const memberPrice = product.member_price_paise
              ? product.member_price_paise / 100
              : null;
            const discount =
              compareAt && compareAt > price
                ? Math.round(((compareAt - price) / compareAt) * 100)
                : null;

            const isWishlisted = wishlist.includes(pId);
            const isAdding = addingId === pId;
            const primaryImage =
              product.images && product.images.length > 0
                ? product.images[0]
                : '/images/products/placeholder.jpg';

            return (
              <Card3DTilt
                key={pId}
                maxTilt={6}
                scale={1.02}
                glare={true}
                className="rounded-3xl h-full flex flex-col"
              >
                <div className="group bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-cyan-400/40 rounded-3xl overflow-hidden p-4 flex flex-col justify-between h-full transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 relative">
                  {/* Top: Wishlist & Badges */}
                  <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden mb-4">
                    <img
                      src={primaryImage}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=60';
                      }}
                    />

                    {/* Discount & Category Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
                      {discount && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                          {discount}% OFF
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/20 text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                        {product.category || 'GEAR'}
                      </span>
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => toggleWishlist(e, pId)}
                      className={`absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md transition-all z-10 cursor-pointer ${
                        isWishlisted
                          ? 'bg-rose-500 text-white'
                          : 'bg-black/50 text-slate-300 hover:text-white hover:bg-black/80'
                      }`}
                      aria-label="Save to Wishlist"
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
                    </button>
                  </div>

                  {/* Center: Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-cyan-400" />
                      <span>4.9</span>
                      <span className="text-slate-400">&bull; Match Ready</span>
                    </div>

                    <Link
                      to={`/store/${product.slug || pId}`}
                      className="block group-hover:text-cyan-400 transition-colors"
                    >
                      <h3 className="font-bold text-white text-base font-display leading-tight line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Price Presentation */}
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-xl font-black text-white font-mono">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                      {compareAt && compareAt > price && (
                        <span className="text-xs line-through text-slate-500 font-mono">
                          ₹{compareAt.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Member Savings Badge */}
                    {memberPrice && memberPrice < price && (
                      <div className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>VIP Member: ₹{memberPrice.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Working Add to Cart */}
                  <div className="pt-4 mt-2 border-t border-white/10 flex items-center gap-2">
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={isAdding}
                      className="w-full py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20"
                    >
                      {isAdding ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-slate-950" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-950" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Card3DTilt>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default FeaturedProductsSection;
