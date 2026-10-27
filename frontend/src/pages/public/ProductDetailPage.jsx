import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ChevronRight,
  AlertCircle,
  Loader2,
  Tag,
  Plus,
  Minus,
  Sparkles,
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';
import { useCartStore } from '../../store/cartStore';
import { useSettingsStore } from '../../store/settingsStore';
import { ProductCard } from '../../components/product/ProductCard';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addItem } = useCartStore();
  const { getBusinessRules, fetchSettings } = useSettingsStore();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // Pincode Delivery Estimator State
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null); // { valid: bool, message: string }

  const rules = getBusinessRules();
  const freeShippingThreshold = Math.round((rules.free_delivery_threshold_paise || 50000) / 100);
  const cardFee = Math.round((rules.card_fee_paise || 10000) / 100);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setSelectedImage(0);
    setQuantity(1);
    setPincodeStatus(null);

    api.get(`/products/${slug}`)
      .then((res) => {
        if (isMounted) {
          const data = res.data || res;
          setProduct(data);

          // Fetch related products in the same category
          if (data?.category) {
            api.get(`/products?category=${encodeURIComponent(data.category)}&active=true&limit=4`)
              .then((relRes) => {
                if (isMounted && Array.isArray(relRes.data)) {
                  setRelatedProducts(
                    relRes.data.filter((p) => (p.slug || p._id) !== (data.slug || data._id))
                  );
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Product not found');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-900 mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8 max-w-lg mx-auto">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
          <p className="text-xs text-slate-500">
            {error || 'The product you are looking for does not exist or has been archived.'}
          </p>
          <div className="pt-2">
            <Link to="/store">
              <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Return to Store Catalog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const price = (product.price_paise || 0) / 100;
  const compareAtPrice = product.compare_at_price_paise
    ? product.compare_at_price_paise / 100
    : (product.mrp_paise ? product.mrp_paise / 100 : null);
  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;
  const totalSavings = compareAtPrice && compareAtPrice > price ? compareAtPrice - price : 0;

  const memberPrice = product.member_price_paise ? product.member_price_paise / 100 : null;
  const memberSavings = memberPrice && memberPrice < price ? price - memberPrice : 0;

  // Real inventory evaluation
  const stock =
    product.stock !== undefined
      ? product.stock
      : (product.stock_quantity !== undefined ? product.stock_quantity : 999);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;

  const images = product.images && product.images.length > 0 ? product.images : [];
  const primaryImage =
    images[selectedImage] ||
    'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80';

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error('This product is currently out of stock');
      return;
    }

    if (stock > 0 && quantity > stock) {
      toast.error(`Only ${stock} items available in stock`);
      return;
    }

    setIsAdding(true);
    addItem({
      _id: product._id,
      productId: product._id || product.slug,
      slug: product.slug,
      name: product.name,
      price_paise: product.price_paise,
      price: product.price_paise,
      member_price_paise: product.member_price_paise,
      images: product.images || [],
      category: product.category,
      qty: quantity,
      quantity,
    });

    toast.success(`Added ${quantity} × ${product.name} to cart!`, {
      icon: '🛍️',
      duration: 3000,
    });

    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  const handleCheckPincode = (e) => {
    e.preventDefault();
    const cleanPin = pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setPincodeStatus({
        valid: false,
        message: 'Please enter a valid 6-digit Indian PIN code.',
      });
      return;
    }

    // Realistic delivery estimation
    setPincodeStatus({
      valid: true,
      pincode: cleanPin,
      message: `Standard Express Delivery to ${cleanPin}: Expected within 3-4 business days. Free shipping on orders above ₹${freeShippingThreshold}.`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto no-scrollbar">
        <Link to="/" className="hover:text-primary-900 shrink-0">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <Link to="/store" className="hover:text-primary-900 shrink-0">
          Store
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <Link
              to={`/store?category=${encodeURIComponent(product.category)}`}
              className="hover:text-primary-900 shrink-0 uppercase"
            >
              {product.category}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span className="text-slate-900 font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-square bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm flex items-center justify-center group">
            <img
              src={primaryImage}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isOutOfStock ? 'grayscale opacity-75' : 'group-hover:scale-105'
              }`}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80';
              }}
            />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {product.featured && (
                <span className="bg-primary-950/90 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                  Featured
                </span>
              )}
              {discountPercent && discountPercent > 0 && (
                <span className="bg-rose-600 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                  Save {discountPercent}%
                </span>
              )}
              {product.category && (
                <span className="bg-white/95 text-slate-900 text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                  {product.category}
                </span>
              )}
            </div>

            {/* Out of Stock Banner Overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px] flex items-center justify-center p-4">
                <span className="bg-red-600 text-white font-black text-sm sm:text-base px-6 py-2.5 rounded-full uppercase tracking-wider shadow-xl">
                  Currently Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === idx
                      ? 'border-primary-900 shadow-md ring-2 ring-primary-200'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`View image thumbnail ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pricing, Inventory & Purchase Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {product.sport && (
                <span className="text-xs font-bold uppercase tracking-wider text-accent-700">
                  {product.sport}
                </span>
              )}
              {product.sku && (
                <span className="text-xs font-medium text-slate-500">
                  SKU: {product.sku}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>
          </div>

          {/* Pricing Box */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-3.5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {compareAtPrice && compareAtPrice > price && (
                <span className="text-lg text-slate-400 line-through font-medium">
                  ₹{compareAtPrice.toLocaleString('en-IN')}
                </span>
              )}
              {discountPercent && discountPercent > 0 && (
                <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">All prices inclusive of applicable taxes.</p>

            {/* Member Savings Banner */}
            {memberPrice && memberSavings > 0 && (
              <div className="p-3 bg-accent-50 rounded-xl border border-accent-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-accent-900">
                  <Tag className="w-4 h-4 text-accent-700 shrink-0" />
                  <span>Member Price: ₹{memberPrice.toLocaleString('en-IN')}</span>
                </div>
                <span className="font-bold text-accent-800">
                  Save ₹{memberSavings.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Stock Availability */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Availability:</span>
              {isOutOfStock ? (
                <span className="font-extrabold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="font-bold text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Only {stock} items left in stock
                </span>
              ) : (
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600" /> In Stock & Ready to Dispatch
                </span>
              )}
            </div>
          </div>

          {/* Quantity & Add to Cart Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-slate-900 select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => (stock > 0 ? Math.min(stock, q + 1) : q + 1))}
                  disabled={isOutOfStock || (stock > 0 && quantity >= stock)}
                  className="p-2.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {stock > 0 && quantity >= stock && (
                <span className="text-xs text-amber-600 font-medium">Max available quantity</span>
              )}
            </div>

            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              className={`w-full py-3.5 font-bold text-base shadow-lg transition-all ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300 shadow-none'
                  : isAdding
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-primary-900 hover:bg-primary-800 text-white shadow-primary-900/20'
              }`}
              leftIcon={
                isAdding ? (
                  <Check className="w-5 h-5 animate-in zoom-in" />
                ) : (
                  <ShoppingBag className="w-5 h-5" />
                )
              }
            >
              {isOutOfStock
                ? 'Item Currently Unavailable'
                : isAdding
                ? 'Added to Cart!'
                : `Add to Cart • ₹${(price * quantity).toLocaleString('en-IN')}`}
            </Button>
          </div>

          {/* Interactive Pincode Delivery Estimator */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-primary-900" />
              <span>Check Delivery & Dispatch Time</span>
            </div>
            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit Pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Check
              </button>
            </form>

            {pincodeStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  pincodeStatus.valid
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {pincodeStatus.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{pincodeStatus.message}</span>
              </div>
            )}
          </div>

          {/* Digital Pass Upsell */}
          <div className="p-4 bg-gradient-to-r from-primary-950 to-primary-900 text-white rounded-2xl shadow-md flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-accent-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Save on this purchase</span>
              </div>
              <p className="text-xs text-slate-300">
                Get the BIGCHAMP Digital Pass (₹{cardFee}) for instant store discounts & rewards.
              </p>
            </div>
            <Link to="/membership" className="shrink-0">
              <Button size="sm" className="bg-accent-500 hover:bg-accent-600 text-white font-bold text-xs">
                Get Pass
              </Button>
            </Link>
          </div>

          {/* Authentic Guarantees Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5 text-slate-700">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-primary-900 shrink-0" />
              <span>Free standard delivery on orders above ₹{freeShippingThreshold}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-4 h-4 text-primary-900 shrink-0" />
              <span>7-Day Return & Size Replacement Policy</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-primary-900 shrink-0" />
              <span>100% Genuine, match-grade verified sports equipment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description & Specifications */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-slate-900">Product Details & Specifications</h3>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl whitespace-pre-line">
          {product.description ||
            'Certified sports equipment engineered for athletic performance, durability, and tournament play.'}
        </p>

        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="pt-4 border-t border-slate-100 max-w-2xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Technical Specifications
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="p-3 bg-slate-50 rounded-xl">
                  <span className="font-semibold text-slate-700 block capitalize">
                    {key.replace('_', ' ')}
                  </span>
                  <span className="text-slate-600">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Related Equipment in {product.category}
            </h3>
            <Link
              to={`/store?category=${encodeURIComponent(product.category)}`}
              className="text-xs font-semibold text-primary-900 hover:text-accent-700 flex items-center gap-1"
            >
              View More <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relProduct) => (
              <ProductCard key={relProduct._id || relProduct.slug} product={relProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
