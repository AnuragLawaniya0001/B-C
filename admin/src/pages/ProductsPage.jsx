import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Archive,
  RefreshCw,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Tag,
  ArrowUpDown,
  FolderOpen,
  Cloud,
  Check,
} from 'lucide-react';
import api from '../services/api';

const getCategoryBadgeClass = (categoryName) => {
  const cat = (categoryName || '').toUpperCase();
  switch (cat) {
    case 'GEARS':
      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
    case 'APPAREL':
      return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
    case 'FITNESS':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    case 'EXCLUSIVE':
      return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
    case 'EQUIPMENT':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
  }
};

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories'

  // Products State
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'ARCHIVED'

  // Categories State
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Status & Feedback
  const [statusMessage, setStatusMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    category: 'GEARS',
    sport: 'general',
    sku: '',
    price_rupees: '',
    member_price_rupees: '',
    stock: 0,
    description: '',
    image_url: '',
    is_cookey: false,
    featured: false,
    active: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({
    name: '',
    slug: '',
    description: '',
    order: 1,
    active: true,
  });

  // Media Gallery Picker State
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');

  // Quick Category Add State
  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');
  const [quickCatLoading, setQuickCatLoading] = useState(false);

  // Fetch Media Items from Cloudinary
  const fetchMedia = async () => {
    try {
      setLoadingMedia(true);
      const res = await api.get('/media?limit=80');
      const data = res.data || res;
      setMediaItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load media gallery', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const openMediaPicker = () => {
    fetchMedia();
    setShowMediaPicker(true);
  };

  const handleQuickAddCategory = async (e) => {
    if (e) e.preventDefault();
    if (!quickCatName.trim()) return;
    try {
      setQuickCatLoading(true);
      const nameUpper = quickCatName.trim().toUpperCase();
      const payload = {
        name: nameUpper,
        order: (categories.length || 0) + 1,
        active: true,
      };
      await api.post('/categories', payload);
      showFeedback('success', `Category "${nameUpper}" created and selected!`);
      await fetchCategories();
      setProductForm((prev) => ({ ...prev, category: nameUpper }));
      setQuickCatName('');
      setShowQuickAddCat(false);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create category';
      showFeedback('error', msg);
    } finally {
      setQuickCatLoading(false);
    }
  };

  const handleDirectMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data || res;
      if (data.url) {
        setProductForm((prev) => ({ ...prev, image_url: data.url }));
        showFeedback('success', 'Image uploaded to Cloudinary successfully!');
        setShowMediaPicker(false);
        fetchMedia();
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed.';
      showFeedback('error', msg);
    } finally {
      setUploadingImage(false);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await api.get('/categories');
      const data = res.data || res;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      let url = '/products?limit=100';
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      if (selectedCategory !== 'ALL') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (selectedStatus === 'ACTIVE') {
        url += '&active=true';
      } else if (selectedStatus === 'ARCHIVED') {
        url += '&active=false';
      }

      const res = await api.get(url);
      const data = res.data || res;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to load products from database.' });
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory, selectedStatus]);

  const showFeedback = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // Product Handlers
  // -------------------------------------------------------------
  const openCreateProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      slug: '',
      category: categories.length > 0 ? categories[0].name : 'GEARS',
      sport: 'general',
      sku: '',
      price_rupees: '',
      member_price_rupees: '',
      stock: 10,
      description: '',
      image_url: '',
      is_cookey: false,
      featured: false,
      active: true,
    });
    setFormErrors({});
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      slug: prod.slug || '',
      category: prod.category || 'GEARS',
      sport: prod.sport || 'general',
      sku: prod.sku || '',
      price_rupees: (prod.price_paise || 0) / 100,
      member_price_rupees: prod.member_price_paise !== undefined ? prod.member_price_paise / 100 : '',
      stock: prod.stock !== undefined ? prod.stock : 0,
      description: prod.description || '',
      image_url: (prod.images && prod.images.length > 0) ? prod.images[0] : '',
      is_cookey: Boolean(prod.is_cookey),
      featured: Boolean(prod.featured),
      active: prod.active !== false,
    });
    setFormErrors({});
    setIsProductModalOpen(true);
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data || res;
      if (data.url) {
        setProductForm((prev) => ({ ...prev, image_url: data.url }));
        showFeedback('success', 'Image uploaded successfully!');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to upload image. Max 5MB allowed (JPEG/PNG/WEBP).';
      showFeedback('error', msg);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!productForm.name.trim()) errors.name = 'Product title is required';
    if (!productForm.price_rupees || Number(productForm.price_rupees) <= 0) {
      errors.price_rupees = 'Price must be greater than ₹0';
    }
    if (Number(productForm.stock) < 0) {
      errors.stock = 'Stock cannot be negative';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setActionLoading(true);
      const pricePaise = Math.round(Number(productForm.price_rupees) * 100);
      const memberPricePaise = productForm.member_price_rupees
        ? Math.round(Number(productForm.member_price_rupees) * 100)
        : Math.round(pricePaise * 0.9);

      const payload = {
        name: productForm.name.trim(),
        category: productForm.category,
        sport: productForm.sport,
        sku: productForm.sku.trim() || undefined,
        price_paise: pricePaise,
        member_price_paise: memberPricePaise,
        stock: Number(productForm.stock),
        description: productForm.description.trim(),
        images: productForm.image_url.trim() ? [productForm.image_url.trim()] : [],
        is_cookey: productForm.is_cookey,
        featured: productForm.featured,
        active: productForm.active,
      };

      if (productForm.slug.trim()) {
        payload.slug = productForm.slug.trim();
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id || editingProduct.slug}`, payload);
        showFeedback('success', `Product '${payload.name}' successfully updated!`);
      } else {
        await api.post('/products', payload);
        showFeedback('success', `Product '${payload.name}' created successfully!`);
      }

      setIsProductModalOpen(false);
      fetchProducts();
      fetchCategories();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to save product';
      showFeedback('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleArchiveProduct = async (prod) => {
    try {
      setActionLoading(true);
      const prodId = prod._id || prod.slug;
      const res = await api.patch(`/products/${prodId}/archive`);
      const updated = res.data || res;
      showFeedback(
        'success',
        `Product '${prod.name}' is now ${updated.active ? 'Active' : 'Archived'}.`
      );
      fetchProducts();
      fetchCategories();
    } catch (err) {
      showFeedback('error', 'Failed to toggle product status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`Are you sure you want to delete '${prod.name}'?`)) return;

    try {
      setActionLoading(true);
      const prodId = prod._id || prod.slug;
      await api.delete(`/products/${prodId}?hard_delete=true`);
      showFeedback('success', `Product '${prod.name}' deleted.`);
      fetchProducts();
      fetchCategories();
    } catch (err) {
      showFeedback('error', 'Failed to delete product');
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Category Handlers
  // -------------------------------------------------------------
  const openCreateCatModal = () => {
    setEditingCat(null);
    setCatForm({
      name: '',
      slug: '',
      description: '',
      order: (categories.length || 0) + 1,
      active: true,
    });
    setIsCatModalOpen(true);
  };

  const openEditCatModal = (cat) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      order: cat.order || 1,
      active: cat.active !== false,
    });
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;

    try {
      setActionLoading(true);
      const payload = {
        name: catForm.name.trim(),
        description: catForm.description.trim(),
        order: Number(catForm.order) || 1,
        active: catForm.active,
      };
      if (catForm.slug.trim()) {
        payload.slug = catForm.slug.trim();
      }

      if (editingCat) {
        await api.put(`/categories/${editingCat._id || editingCat.slug}`, payload);
        showFeedback('success', `Category '${payload.name}' updated!`);
      } else {
        await api.post('/categories', payload);
        showFeedback('success', `Category '${payload.name}' created!`);
      }

      setIsCatModalOpen(false);
      fetchCategories();
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save category';
      showFeedback('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Are you sure you want to remove category '${cat.name}'?`)) return;

    try {
      setActionLoading(true);
      const res = await api.delete(`/categories/${cat._id || cat.slug}`);
      const data = res.data || res;
      showFeedback('success', data.message || 'Category deleted');
      fetchCategories();
      fetchProducts();
    } catch (err) {
      showFeedback('error', 'Failed to delete category');
    } finally {
      setActionLoading(false);
    }
  };

  // Stats calculation
  const totalProductsCount = products.length;
  const activeProductsCount = products.filter((p) => p.active !== false).length;
  const lowStockCount = products.filter((p) => (p.stock || 0) < 10).length;
  const cookeyCount = products.filter((p) => p.is_cookey).length;

  const filteredMedia = mediaItems.filter((m) => {
    if (!mediaSearch.trim()) return true;
    const query = mediaSearch.toLowerCase();
    return (
      m.filename?.toLowerCase().includes(query) ||
      m.public_id?.toLowerCase().includes(query) ||
      m.format?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-primary-600" /> Catalog & Product Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Authoritative store inventory: prices, member discounts, stock levels, and media synced with MongoDB.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'products' ? (
            <Button
              variant="primary"
              onClick={openCreateProductModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add New Product
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={openCreateCatModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add New Category
            </Button>
          )}
        </div>
      </div>

      {/* Global Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Catalog</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalProductsCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active in Store</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{activeProductsCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Low Stock (&lt; 10)</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{lowStockCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Categories</p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{categories.length}</p>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" /> Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`py-3 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Categories ({categories.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PRODUCTS LIST */}
      {/* ========================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by title, SKU, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-xs font-medium border rounded-lg bg-white text-slate-800"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 text-xs font-medium border rounded-lg bg-white text-slate-800"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="ARCHIVED">Archived Only</option>
                </select>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={fetchProducts}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Reload
              </Button>
            </div>
          </Card>

          {/* Product Items Table */}
          {loadingProducts ? (
            <Card className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
              <span>Loading products catalog...</span>
            </Card>
          ) : products.length === 0 ? (
            <Card className="p-12 text-center text-slate-500">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No products match your filter criteria</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try clearing search terms or click &quot;Add New Product&quot; to expand your store.
              </p>
            </Card>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Category / Sport</th>
                    <th className="py-3 px-4">Pricing</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const price = (p.price_paise || 0) / 100;
                    const memberPrice = (p.member_price_paise || 0) / 100;
                    const imageSrc = p.images && p.images.length > 0 ? p.images[0] : null;

                    return (
                      <tr key={p._id || p.slug} className="hover:bg-slate-50/70 transition-colors">
                        {/* Image & Title */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                              {imageSrc ? (
                                <img
                                  src={imageSrc}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '';
                                  }}
                                />
                              ) : (
                                <Package className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{p.name}</span>
                                {p.is_cookey && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                    Cookey
                                  </span>
                                )}
                                {p.featured && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                                    Featured
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">
                                {p.sku ? `SKU: ${p.sku}` : `slug: ${p.slug}`}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category & Sport */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => setSelectedCategory(p.category)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${getCategoryBadgeClass(
                              p.category
                            )}`}
                            title="Click to filter catalog by this category"
                          >
                            <Tag className="w-3 h-3 opacity-60" />
                            {p.category}
                          </button>
                          <span className="text-xs text-slate-500 block mt-1 capitalize">
                            Sport: {p.sport || 'general'}
                          </span>
                        </td>

                        {/* Price & Member Discount */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">₹{price.toFixed(2)}</div>
                          <div className="text-xs text-emerald-600 font-semibold">
                            ₹{memberPrice.toFixed(2)} <span className="text-[10px] text-slate-400">(Card)</span>
                          </div>
                        </td>

                        {/* Inventory Stock */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              p.stock > 10
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.stock > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {p.stock} in stock
                          </span>
                        </td>

                        {/* Active Status */}
                        <td className="py-3.5 px-4">
                          {p.active !== false ? (
                            <Badge variant="success" size="sm">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm">
                              Archived
                            </Badge>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditProductModal(p)}
                              className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleArchiveProduct(p)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                p.active !== false
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={p.active !== false ? 'Archive product' : 'Restore product'}
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CATEGORIES LIST */}
      {/* ========================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Categories structure the Bigchamp customer store and products catalog. Archiving a category preserves product records and prevents orphaned items.
            </p>
          </Card>

          {loadingCategories ? (
            <Card className="p-12 text-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary-600" />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <Card key={cat._id || cat.slug} className="p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary-600" /> {cat.name}
                      </h3>
                      <Badge variant={cat.active ? 'success' : 'default'} size="sm">
                        {cat.active ? 'Active' : 'Archived'}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-1">slug: {cat.slug}</p>
                    <p className="text-xs text-slate-600 mt-2">
                      {cat.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      {cat.product_count !== undefined ? `${cat.product_count} Products` : 'Catalog'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditCatModal(cat)}
                        className="p-1.5 text-slate-500 hover:text-primary-600 rounded-lg"
                        title="Edit category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg"
                        title="Delete / Archive category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* PRODUCT CREATE / EDIT MODAL */}
      {/* ========================================================= */}
      {isProductModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 1000 }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-600" />
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Pro Grade English Willow Cricket Bat"
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${
                      formErrors.name ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.name}</p>
                  )}
                </div>

                {/* Category with Quick Add Button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Category *</label>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddCat(!showQuickAddCat)}
                      className="text-[11px] font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      {showQuickAddCat ? 'Cancel' : '+ New Category'}
                    </button>
                  </div>

                  {showQuickAddCat && (
                    <div className="flex items-center gap-1.5 p-2 bg-primary-50/60 rounded-lg border border-primary-200 mb-2">
                      <input
                        type="text"
                        placeholder="e.g. SWIMWEAR"
                        value={quickCatName}
                        onChange={(e) => setQuickCatName(e.target.value.toUpperCase())}
                        className="flex-1 px-2.5 py-1 text-xs border border-primary-300 rounded bg-white font-bold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddCategory}
                        disabled={quickCatLoading || !quickCatName.trim()}
                        className="px-2.5 py-1 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded cursor-pointer disabled:opacity-50"
                      >
                        {quickCatLoading ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  )}

                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {productForm.category &&
                      !categories.some((c) => c.name?.toUpperCase() === productForm.category?.toUpperCase()) && (
                        <option value={productForm.category}>{productForm.category} (Current)</option>
                      )}
                    {categories.map((c) => (
                      <option key={c.slug || c.name} value={c.name}>
                        {c.name} {c.product_count !== undefined ? `(${c.product_count} products)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sport Identifier</label>
                  <input
                    type="text"
                    value={productForm.sport}
                    onChange={(e) => setProductForm({ ...productForm, sport: e.target.value })}
                    placeholder="e.g. cricket, football, fitness"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU (Stock Keeping Unit)</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="e.g. BC-CRIC-001"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inventory Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${
                      formErrors.stock ? 'border-rose-500' : 'border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Regular Retail Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productForm.price_rupees}
                    onChange={(e) => setProductForm({ ...productForm, price_rupees: e.target.value })}
                    placeholder="4500.00"
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${
                      formErrors.price_rupees ? 'border-rose-500' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.price_rupees && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.price_rupees}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Member Discount Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.member_price_rupees}
                    onChange={(e) => setProductForm({ ...productForm, member_price_rupees: e.target.value })}
                    placeholder="Defaults to 10% discount if empty"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Provide materials, specs, warranty, or instructions..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Product Image Asset with Browse Media Gallery + Direct Upload */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">Product Image Asset</label>
                    <span className="text-[10px] text-slate-400 font-medium">Cloudinary Integrated</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                    <div className="w-20 h-20 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative shadow-xs">
                      {productForm.image_url ? (
                        <img
                          src={productForm.image_url}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                      )}
                    </div>

                    <div className="space-y-2 flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Browse Media Gallery Button */}
                        <button
                          type="button"
                          onClick={openMediaPicker}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-xs transition-colors cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          Browse Media Gallery
                        </button>

                        {/* Upload Directly to Cloudinary */}
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 shadow-xs transition-colors">
                            {uploadingImage ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-600" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            {uploadingImage ? 'Uploading...' : 'Upload File'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>

                        {productForm.image_url && (
                          <button
                            type="button"
                            onClick={() => setProductForm({ ...productForm, image_url: '' })}
                            className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                        placeholder="Or enter image URL (https://res.cloudinary.com/...)"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Flags */}
                <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.active}
                      onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })}
                      className="w-4 h-4 rounded text-primary-600 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700">Active in Store</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.featured}
                      onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-primary-600 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700">Feature on Homepage</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.is_cookey}
                      onChange={(e) => setProductForm({ ...productForm, is_cookey: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-amber-800">Cookey Exclusive (Members Only)</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsProductModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={actionLoading || uploadingImage}
                  leftIcon={actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                >
                  {actionLoading ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MEDIA GALLERY PICKER MODAL (zIndex: 2000)                */}
      {/* ========================================================= */}
      {showMediaPicker && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          style={{ zIndex: 2000 }}
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl p-6 max-h-[88vh] flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-primary-600" />
                  Select Image from Media Gallery
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any asset to instantly assign it to this product, or upload a new file.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    Upload New
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDirectMediaUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => setShowMediaPicker(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="py-3 border-b border-slate-100 shrink-0">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search media files by name, tag, or format..."
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-4 overflow-y-auto flex-1 pr-1">
              {loadingMedia ? (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                  <p className="text-xs">Loading Cloudinary media assets...</p>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold">No media assets found</p>
                </div>
              ) : (
                filteredMedia.map((m) => (
                  <div
                    key={m._id || m.public_id || m.url}
                    onClick={() => {
                      setProductForm((prev) => ({ ...prev, image_url: m.url }));
                      setShowMediaPicker(false);
                      showFeedback('success', 'Image selected from Media Gallery!');
                    }}
                    className="group relative rounded-xl border border-slate-200 hover:border-primary-500 overflow-hidden cursor-pointer transition-all hover:shadow-md bg-slate-50 flex flex-col"
                  >
                    <div className="aspect-square bg-slate-100 overflow-hidden relative">
                      <img
                        src={m.url}
                        alt={m.filename || 'asset'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                        }}
                      />
                    </div>
                    <div className="p-2 bg-white border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 truncate block flex-1">
                        {m.filename || m.public_id || 'Image Asset'}
                      </span>
                      <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-600 ml-1">
                        {m.format || 'IMG'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-500">
                Showing {filteredMedia.length} Cloudinary assets
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowMediaPicker(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CATEGORY CREATE / EDIT MODAL */}
      {/* ========================================================= */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingCat ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. FOOTWEAR, NUTRITION"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="Category scope and details..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={catForm.order}
                    onChange={(e) => setCatForm({ ...catForm, order: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catForm.active}
                      onChange={(e) => setCatForm({ ...catForm, active: e.target.checked })}
                      className="w-4 h-4 rounded text-primary-600"
                    />
                    <span className="text-xs font-semibold text-slate-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCatModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
