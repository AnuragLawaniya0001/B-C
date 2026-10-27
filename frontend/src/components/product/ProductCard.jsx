import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Check, Tag, Eye, AlertTriangle } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { Card3DTilt } from '../3d/Card3DTilt';
import toast from 'react-hot-toast';

export function ProductCard({ product }) {
  const { addItem } = useCartStore();
  const [isAdding, setIsAdding] = useState(false);

  if (!product) return null;

  const price = (product.price_paise || 0) / 100;
  const compareAtPrice = product.compare_at_price_paise
    ? product.compare_at_price_paise / 100
    : (product.mrp_paise ? product.mrp_paise / 100 : null);
  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  const memberPrice = product.member_price_paise ? product.member_price_paise / 100 : null;

  // Real inventory evaluation matching MongoDB schema ('stock')
  const stock =
    product.stock !== undefined
      ? product.stock
      : (product.stock_quantity !== undefined ? product.stock_quantity : 999);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;

  const productSlug = product.slug || product._id;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
      toast.error('Item is currently out of stock');
      return;
    }

    setIsAdding(true);
    addItem({
      _id: product._id,
      slug: product.slug,
      name: product.name,
      price_paise: product.price_paise,
      member_price_paise: product.member_price_paise,
      images: product.images || [],
      category: product.category,
      quantity: 1,
    });

    toast.success(`Added ${product.name} to cart!`, {
      icon: '🛍️',
      duration: 2500,
    });

    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  const primaryImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : '/images/products/placeholder.jpg';

  return (
    <Card3DTilt maxTilt={6} scale={1.02} glare={true} data-scroll-card className="scroll-card rounded-2xl">
      <div className="group bg-slate-900/70 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden relative rounded-2xl h-full">
        {/* Product Image Link */}
        <Link
          to={`/store/${productSlug}`}
          className="relative block w-full aspect-square bg-slate-950 overflow-hidden"
        >
          <img
            src={primaryImage}
            alt={product.name}
            data-scroll-image
            className={`scroll-image w-full h-full object-cover transition-transform duration-500 ${
              isOutOfStock ? 'grayscale opacity-60' : 'group-hover:scale-110'
            }`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=60';
            }}
          />

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {product.featured && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">
                Featured
              </span>
            )}
            {discountPercent && discountPercent > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                -{discountPercent}% OFF
              </span>
            )}
            {product.category && (
              <span className="bg-slate-950/80 backdrop-blur-sm text-slate-200 border border-white/10 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                {product.category}
              </span>
            )}
          </div>

          {/* Low Stock Indicator */}
          {isLowStock && (
            <div className="absolute top-2.5 right-2.5 z-10">
              <span className="bg-amber-500/95 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-slate-950" />
                Only {stock} left
              </span>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] flex items-center justify-center p-4">
              <span className="bg-red-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                Out of Stock
              </span>
            </div>
          )}

          {/* Quick View Hover Action */}
          {!isOutOfStock && (
            <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="bg-slate-900/90 text-white border border-white/20 p-2 rounded-xl shadow-md flex items-center gap-1 text-xs font-semibold backdrop-blur-sm">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Details</span>
              </span>
            </div>
          )}
        </Link>

        {/* Product Information */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-slate-900">
          <div className="space-y-1">
            <Link
              to={`/store/${productSlug}`}
              className="block text-sm font-bold text-white hover:text-amber-400 line-clamp-2 transition-colors leading-snug"
            >
              {product.name}
            </Link>
            {product.sport && (
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {product.sport}
              </span>
            )}
          </div>

          {/* Pricing Block */}
          <div className="pt-2 border-t border-slate-800 flex items-end justify-between gap-2">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-base sm:text-lg font-black text-white">
                  ₹{price.toLocaleString('en-IN')}
                </span>
                {compareAtPrice && compareAtPrice > price && (
                  <span className="text-xs text-slate-500 line-through font-medium">
                    ₹{compareAtPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              {memberPrice && memberPrice < price && (
                <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-0.5">
                  <Tag className="w-3 h-3 shrink-0" />
                  Member: ₹{memberPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Quick Add Button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                  : isAdding
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 active:scale-95'
              }`}
              aria-label={isOutOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
              title={isOutOfStock ? 'Currently out of stock' : 'Add to cart'}
            >
              {isAdding ? (
                <Check className="w-4 h-4 animate-in zoom-in" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </Card3DTilt>
  );
}

export default ProductCard;
