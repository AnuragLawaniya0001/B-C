import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Layers,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Film,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  ShoppingBag,
  Sliders,
  RotateCcw,
  Upload,
  Search,
  FolderOpen,
  Filter,
  Play,
  Cloud,
  Check,
  Copy,
  MapPin,
  CheckCheck,
  Tag,
  Package,
} from 'lucide-react';
import api from '../services/api';

const SECTION_METADATA = {
  hero_campaign: {
    name: 'Hero Campaign Banner',
    position: 'Top of Homepage (Above the Fold)',
    positionBadge: 'Page Top #1',
    description: 'The first thing customers see. Large high-impact video or banner with main headline and shop button.',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Film,
  },
  collections_strip: {
    name: 'Shop by Collection (Discipline Strip)',
    position: 'Upper Page (Below Hero)',
    positionBadge: 'Section #2',
    description: 'Circular category avatars (GEARS, FOOTWEAR, APPAREL, ACCESSORIES) for quick sport filtering.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Sliders,
  },
  curated_products: {
    name: 'Curated Products Carousel',
    position: 'Upper Page',
    positionBadge: 'Section #3',
    description: 'Hand-picked featured products and custom category tabs. Show only the exact products you choose for the homepage.',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: ShoppingBag,
  },
  editorial_showcase: {
    name: 'Editorial 3-Card Showcase',
    position: 'Mid Page',
    positionBadge: 'Section #4',
    description: '3 featured story cards (Match-Day Excellence, Pro Training Gear, Tournament Edition) with images and links.',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Sparkles,
  },
  seasonal_sale_banner: {
    name: 'Seasonal Campaign Video Banner',
    position: 'Mid Page (Sale Spotlight)',
    positionBadge: 'Section #5',
    description: 'Full-width festival campaign video banner with discount narrative and direct shop button.',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: Film,
  },
  athlete_testimonials: {
    name: 'Athlete Reviews & Testimonials',
    position: 'Lower Page (Social Proof)',
    positionBadge: 'Section #6',
    description: 'Player reviews, ratings, and quotes from Indian athletes to build trust and increase conversions.',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Sparkles,
  },
  community_feed: {
    name: 'Community Photo Feed (#BIGCHAMP)',
    position: 'Near Footer',
    positionBadge: 'Section #7',
    description: 'Photo grid of real athletes using Bigchamp equipment on field to encourage social community engagement.',
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
    icon: ImageIcon,
  },
  trust_pillars: {
    name: 'Brand Trust & Guarantee Pillars',
    position: 'Homepage Footer',
    positionBadge: 'Section #8',
    description: '100% Genuine Sports Gear, 7-Day Easy Returns, Free Shipping & Certified Equipment guarantees.',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Layers,
  },
};

export default function StorefrontBuilderPage() {
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [savingSection, setSavingSection] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Available Media Assets (for Browse Gallery & Picker)
  const [mediaAssets, setMediaAssets] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Store Catalog Products & Categories (for Curated Products Section)
  const [catalogueProducts, setCatalogueProducts] = useState([]);
  const [storeCategories, setStoreCategories] = useState([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productPickerSearch, setProductPickerSearch] = useState('');
  const [productPickerCategory, setProductPickerCategory] = useState('ALL');

  // Browse Media Gallery Modal (Picker)
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState('browse_only'); // 'browse_only' | 'media_url' | 'poster_url' | `item_${idx}`
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerTypeFilter, setPickerTypeFilter] = useState('ALL'); // 'ALL' | 'image' | 'video'
  const [copiedUrl, setCopiedUrl] = useState('');

  // Direct Upload State
  const [uploadingTarget, setUploadingTarget] = useState(null); // 'general' | 'media_url' | 'poster_url' | `item_${idx}`
  const directFileInputRef = useRef(null);

  // Section Edit / Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    section_id: '',
    section_key: '',
    title: '',
    subtitle: '',
    section_type: 'hero_campaign',
    media_url: '',
    poster_url: '',
    media_type: 'video',
    cta_text: 'Explore Collection',
    cta_link: '/catalogue',
    is_active: true,
    display_order: 1,
    items: [],
    product_ids: [],
    config: {
      tabs: ['ALL', 'GEARS', 'APPAREL', 'FITNESS', 'EXCLUSIVE'],
      mode: 'curated',
    },
  });

  // Fetch Storefront Sections
  const fetchSections = async () => {
    try {
      setLoadingSections(true);
      const res = await api.get('/admin/storefront/sections');
      const data = res.data || res;
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load storefront sections:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load storefront configuration.' });
    } finally {
      setLoadingSections(false);
    }
  };

  // Fetch Media Assets
  const fetchMediaAssets = async () => {
    try {
      setLoadingMedia(true);
      const res = await api.get('/media?limit=150&include_archived=false');
      const data = res.data || res;
      const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      setMediaAssets(list);
    } catch (err) {
      console.error('Failed to load media assets:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  // Fetch Store Catalog & Categories
  const fetchCatalogue = async () => {
    try {
      const [prodsRes, catsRes] = await Promise.allSettled([
        api.get('/products?limit=100'),
        api.get('/categories'),
      ]);
      if (prodsRes.status === 'fulfilled') {
        const pData = prodsRes.value.data || prodsRes.value;
        setCatalogueProducts(Array.isArray(pData) ? pData : []);
      }
      if (catsRes.status === 'fulfilled') {
        const cData = catsRes.value.data || catsRes.value;
        setStoreCategories(Array.isArray(cData) ? cData : []);
      }
    } catch (err) {
      console.error('Failed to load catalogue products or categories:', err);
    }
  };

  useEffect(() => {
    fetchSections();
    fetchMediaAssets();
    fetchCatalogue();
  }, []);

  // View Customer Storefront
  const handleViewStorefront = () => {
    const storeUrl =
      window.location.port === '3001'
        ? `${window.location.protocol}//${window.location.hostname}:3000`
        : '/';
    window.open(storeUrl, '_blank');
  };

  // =========================================================================
  // DIRECT CLOUDINARY UPLOAD HANDLER
  // =========================================================================
  const triggerDirectUpload = (target) => {
    setUploadingTarget(target);
    if (directFileInputRef.current) {
      directFileInputRef.current.value = '';
      directFileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const target = uploadingTarget;
    try {
      setStatusMessage({ type: 'info', text: `Uploading "${file.name}" to Cloudinary...` });
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('display_name', file.name);
      uploadFormData.append('category', 'CAMPAIGN');

      const res = await api.post('/media', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedAsset = res.data || res;
      const cloudUrl = uploadedAsset.url;

      if (target === 'media_url') {
        setFormData((prev) => ({
          ...prev,
          media_url: cloudUrl,
          media_type: uploadedAsset.media_type || (file.type.startsWith('video/') ? 'video' : 'image'),
          poster_url: uploadedAsset.poster_url || prev.poster_url || (uploadedAsset.media_type === 'image' ? cloudUrl : ''),
        }));
      } else if (target === 'poster_url') {
        setFormData((prev) => ({
          ...prev,
          poster_url: cloudUrl,
        }));
      } else if (target && target.startsWith('item_')) {
        const itemIdx = parseInt(target.replace('item_', ''), 10);
        setFormData((prev) => {
          const newItems = [...prev.items];
          if (newItems[itemIdx]) {
            newItems[itemIdx] = { ...newItems[itemIdx], image: cloudUrl };
          }
          return { ...prev, items: newItems };
        });
      }

      await fetchMediaAssets();
      setStatusMessage({
        type: 'success',
        text: `Uploaded "${file.name}" successfully to Cloudinary!`,
      });
    } catch (err) {
      console.error('Upload failed:', err);
      const errMsg = err.response?.data?.detail || err.message || 'Upload failed.';
      setStatusMessage({ type: 'error', text: `Failed to upload to Cloudinary: ${errMsg}` });
    } finally {
      setUploadingTarget(null);
    }
  };

  // =========================================================================
  // MEDIA PICKER SELECTION (BROWSE GALLERY)
  // =========================================================================
  const openMediaPicker = (target = 'browse_only') => {
    setMediaPickerTarget(target);
    setPickerSearch('');
    setPickerTypeFilter(target === 'poster_url' ? 'image' : 'ALL');
    setShowMediaPicker(true);
  };

  const handleSelectAsset = (asset) => {
    const target = mediaPickerTarget;
    if (target === 'browse_only') {
      navigator.clipboard.writeText(asset.url);
      setCopiedUrl(asset.url);
      setStatusMessage({ type: 'success', text: `Copied Cloudinary URL for "${asset.display_name}"!` });
      setTimeout(() => setCopiedUrl(''), 2000);
      return;
    }
    if (target === 'media_url') {
      setFormData((prev) => ({
        ...prev,
        media_url: asset.url,
        media_type: asset.media_type,
        poster_url: asset.poster_url || (asset.media_type === 'image' ? asset.url : prev.poster_url),
      }));
    } else if (target === 'poster_url') {
      setFormData((prev) => ({
        ...prev,
        poster_url: asset.url,
      }));
    } else if (target && target.startsWith('item_')) {
      const itemIdx = parseInt(target.replace('item_', ''), 10);
      setFormData((prev) => {
        const newItems = [...prev.items];
        if (newItems[itemIdx]) {
          newItems[itemIdx] = { ...newItems[itemIdx], image: asset.url };
        }
        return { ...prev, items: newItems };
      });
    }
    setShowMediaPicker(false);
  };

  // Filtered Picker Assets
  const filteredPickerAssets = mediaAssets.filter((a) => {
    if (pickerTypeFilter !== 'ALL' && a.media_type !== pickerTypeFilter) return false;
    if (!pickerSearch.trim()) return true;
    const q = pickerSearch.toLowerCase();
    return (
      (a.display_name && a.display_name.toLowerCase().includes(q)) ||
      (a.url && a.url.toLowerCase().includes(q)) ||
      (a.category && a.category.toLowerCase().includes(q))
    );
  });

  // Filtered Products for Product Selector Modal
  const filteredCatalogueProducts = useMemo(() => {
    return catalogueProducts.filter((p) => {
      if (productPickerCategory !== 'ALL') {
        const cat = (p.category || '').toUpperCase();
        if (cat !== productPickerCategory.toUpperCase()) return false;
      }
      if (!productPickerSearch.trim()) return true;
      const q = productPickerSearch.toLowerCase();
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    });
  }, [catalogueProducts, productPickerCategory, productPickerSearch]);

  const toggleProductSelection = (productId) => {
    const current = formData.product_ids || [];
    const idStr = String(productId);
    const exists = current.some((id) => String(id) === idStr);
    const next = exists
      ? current.filter((id) => String(id) !== idStr)
      : [...current, idStr];
    setFormData({
      ...formData,
      product_ids: next,
      config: {
        ...formData.config,
        product_ids: next,
      },
    });
  };

  // =========================================================================
  // STOREFRONT SECTION CRUD
  // =========================================================================
  const handleEditSection = (section) => {
    setEditingSection(section);
    const secId = section.id || section.section_id || section._id || section.section_key;
    const rawProductIds = Array.isArray(section.product_ids)
      ? section.product_ids
      : Array.isArray(section.config?.product_ids)
      ? section.config.product_ids
      : [];

    setFormData({
      section_id: secId,
      section_key: section.section_key || secId,
      title: section.title || '',
      subtitle: section.subtitle || '',
      section_type: section.section_type || 'hero_campaign',
      media_url: section.media_url || '',
      poster_url: section.poster_url || '',
      media_type: section.media_type || (section.section_type.includes('video') ? 'video' : 'image'),
      cta_text: section.cta_text || section.cta_label || '',
      cta_link: section.cta_link || '',
      is_active: section.is_active !== false,
      display_order: section.display_order || section.order || 1,
      items: Array.isArray(section.items) ? section.items : [],
      product_ids: rawProductIds,
      config: section.config || {
        tabs: ['ALL', 'GEARS', 'APPAREL', 'FITNESS', 'EXCLUSIVE'],
        mode: 'curated',
      },
    });
    setIsModalOpen(true);
  };

  const handleCreateSection = () => {
    setEditingSection(null);
    setFormData({
      section_id: `sec_${Date.now()}`,
      section_key: `sec_${Date.now()}`,
      title: 'New Storefront Campaign',
      subtitle: 'Exclusive athletic merchandise, seasonal drop, or video spotlight',
      section_type: 'hero_campaign',
      media_url: '',
      poster_url: '',
      media_type: 'video',
      cta_text: 'Shop The Collection',
      cta_link: '/catalogue',
      is_active: true,
      display_order: (sections.length || 0) + 1,
      items: [],
      product_ids: [],
      config: {
        tabs: ['ALL', 'GEARS', 'APPAREL', 'FITNESS', 'EXCLUSIVE'],
        mode: 'curated',
      },
    });
    setIsModalOpen(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    try {
      setSavingSection(true);
      const targetId = editingSection
        ? (editingSection.id || editingSection.section_id || editingSection._id || editingSection.section_key)
        : null;

      const payload = {
        title: formData.title,
        subtitle: formData.subtitle,
        section_type: formData.section_type,
        media_url: formData.media_url,
        poster_url: formData.poster_url,
        media_type: formData.media_type,
        cta_text: formData.cta_text,
        cta_label: formData.cta_text,
        cta_link: formData.cta_link,
        display_order: formData.display_order,
        order: formData.display_order,
        is_active: formData.is_active,
        items: formData.items,
        product_ids: formData.product_ids,
        config: formData.config,
      };

      if (editingSection && targetId) {
        await api.put(`/admin/storefront/sections/${targetId}`, payload);
        setStatusMessage({ type: 'success', text: `Section "${formData.title}" updated successfully.` });
      } else {
        await api.post('/admin/storefront/sections', {
          ...payload,
          section_key: formData.section_key || `sec_${Date.now()}`,
        });
        setStatusMessage({ type: 'success', text: `New section "${formData.title}" added to homepage.` });
      }
      setIsModalOpen(false);
      await fetchSections();
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Save failed.';
      setStatusMessage({ type: 'error', text: `Failed to save section: ${errMsg}` });
    } finally {
      setSavingSection(false);
    }
  };

  const handleToggleActive = async (section) => {
    try {
      const targetId = section.id || section.section_id || section._id || section.section_key;
      const updatedStatus = !section.is_active;
      await api.put(`/admin/storefront/sections/${targetId}`, {
        ...section,
        is_active: updatedStatus,
      });
      setStatusMessage({
        type: 'success',
        text: `Section "${section.title}" is now ${updatedStatus ? 'Live on Storefront' : 'Hidden (Draft)'}.`,
      });
      await fetchSections();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update section visibility.' });
    }
  };

  const handleMoveSection = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const updatedSections = [...sections];
    const [moved] = updatedSections.splice(index, 1);
    updatedSections.splice(newIndex, 0, moved);

    const sectionIds = updatedSections.map((sec) => sec.id || sec.section_id || sec.section_key);

    setSections(updatedSections.map((s, idx) => ({ ...s, display_order: idx + 1, order: (idx + 1) * 10 })));

    try {
      await api.put('/admin/storefront/sections/reorder', { section_ids: sectionIds });
      setStatusMessage({ type: 'success', text: 'Storefront section order updated.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to save section order.' });
      await fetchSections();
    }
  };

  const handleDeleteSection = async (section) => {
    if (!window.confirm(`Delete section "${section.title}"?`)) return;
    try {
      const targetId = section.id || section.section_id || section._id || section.section_key;
      await api.delete(`/admin/storefront/sections/${targetId}`);
      setStatusMessage({ type: 'success', text: 'Section deleted.' });
      await fetchSections();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to delete section.' });
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset homepage layout to the 8 standard storefront sections?')) return;
    try {
      setLoadingSections(true);
      await api.post('/admin/storefront/sections/seed-defaults');
      setStatusMessage({ type: 'success', text: 'Homepage sections restored to default layout.' });
      await fetchSections();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to reset sections.' });
    } finally {
      setLoadingSections(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for direct Cloudinary upload */}
      <input
        ref={directFileInputRef}
        type="file"
        accept="image/*,video/mp4,video/webm"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header with Title and Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Storefront Merchandising</h1>
            <Badge variant="primary" className="bg-primary-950 text-white font-bold">Homepage Visual Layout</Badge>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" /> Cloudinary Media Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Curate featured products, configure category tabs, and customize videos & banners on your homepage.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerDirectUpload('general')}
            leftIcon={<Upload className="w-4 h-4 text-emerald-600" />}
            title="Upload any image or video directly to Cloudinary"
            className="hover:border-emerald-500 hover:text-emerald-700 font-bold border-slate-300"
          >
            Upload Media
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openMediaPicker('browse_only')}
            leftIcon={<FolderOpen className="w-4 h-4 text-indigo-600" />}
            title="Browse all Cloudinary images and videos"
            className="hover:border-indigo-500 hover:text-indigo-700 font-bold border-slate-300"
          >
            Browse Gallery
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleViewStorefront}
            leftIcon={<Eye className="w-4 h-4 text-primary-600" />}
            title="Open live customer storefront in new tab"
            className="hover:border-primary-500 hover:text-primary-700 font-bold border-slate-300"
          >
            View Live Store
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-600" />}
            title="Restore default standard layout"
          >
            Restore
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateSection}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Section
          </Button>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
            statusMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : statusMessage.type === 'info'
              ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : statusMessage.type === 'info' ? (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Visual Guide Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-indigo-400 shrink-0" />
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-indigo-300">
              Live Homepage Sequence & Placement Guide
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Sections are arranged from top to bottom exactly as shown to your customers. Configure products & tabs to curate your storefront.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold shrink-0">
          <span className="px-2.5 py-1 bg-white/10 rounded-md border border-white/10">
            {sections.length} Sections
          </span>
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30">
            {catalogueProducts.length} Products in Catalog
          </span>
        </div>
      </div>

      {/* Sections List */}
      {loadingSections ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-500 mb-2" />
          <p className="text-sm">Loading storefront merchandising configuration...</p>
        </div>
      ) : sections.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No storefront sections configured</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Click Restore Defaults to restore the standard 8 high-performance homepage sections.
          </p>
          <Button variant="primary" size="sm" onClick={handleResetDefaults} className="mt-4">
            Restore Defaults
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, idx) => {
            const meta = SECTION_METADATA[section.section_type] || {
              name: section.title,
              position: `Custom Position #${idx + 1}`,
              positionBadge: `#${idx + 1}`,
              description: section.subtitle || 'Custom homepage section',
              badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
              icon: Layers,
            };
            const MetaIcon = meta.icon;

            // Determine thumbnail to show
            let thumbUrl = null;
            if (section.media_type === 'video') {
              thumbUrl = section.poster_url || section.media_url;
            } else if (section.media_url) {
              thumbUrl = section.media_url;
            } else if (section.poster_url) {
              thumbUrl = section.poster_url;
            } else if (section.items && section.items.length > 0) {
              const itemImg = section.items.find((i) => i.image);
              if (itemImg) thumbUrl = itemImg.image;
            } else if (section.section_type === 'curated_products') {
              const pIds = section.product_ids || section.config?.product_ids || [];
              if (pIds.length > 0) {
                const matchedProd = catalogueProducts.find((p) => pIds.includes(String(p._id)) || pIds.includes(String(p.id)));
                if (matchedProd && matchedProd.images?.length > 0) thumbUrl = matchedProd.images[0];
              }
            }

            return (
              <Card
                key={section.id || section.section_id || section.section_key || idx}
                className={`p-4 bg-white border transition-all ${
                  section.is_active
                    ? 'border-slate-200 shadow-xs hover:border-slate-300'
                    : 'border-dashed border-slate-300 bg-slate-50/60 opacity-75'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Drag / Order Controls & Placement Details */}
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    {/* Order Controls */}
                    <div className="flex flex-col items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
                      <button
                        onClick={() => handleMoveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Higher on Page"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <span className="font-mono text-xs font-black text-slate-700 my-0.5">{idx + 1}</span>
                      <button
                        onClick={() => handleMoveSection(idx, 'down')}
                        disabled={idx === sections.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Lower on Page"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Media / Visual Thumbnail */}
                    <div className="w-24 h-16 bg-slate-900 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-200 shadow-xs">
                      {section.media_type === 'video' ? (
                        <>
                          {thumbUrl ? (
                            <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Film className="w-6 h-6 text-indigo-400" />
                          )}
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] text-white font-bold flex items-center gap-0.5">
                            <Film className="w-2.5 h-2.5" /> MP4
                          </span>
                        </>
                      ) : thumbUrl ? (
                        <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                      ) : section.section_type === 'curated_products' ? (
                        <div className="flex flex-col items-center justify-center text-emerald-400">
                          <ShoppingBag className="w-5 h-5 mb-0.5" />
                          <span className="text-[8px] font-bold">PRODUCTS</span>
                        </div>
                      ) : section.section_type === 'athlete_testimonials' ? (
                        <div className="flex flex-col items-center justify-center text-amber-400">
                          <Sparkles className="w-5 h-5 mb-0.5" />
                          <span className="text-[8px] font-bold">REVIEWS</span>
                        </div>
                      ) : section.section_type === 'community_feed' ? (
                        <div className="flex flex-col items-center justify-center text-pink-400">
                          <ImageIcon className="w-5 h-5 mb-0.5" />
                          <span className="text-[8px] font-bold">FEED</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Layers className="w-5 h-5 mb-0.5" />
                          <span className="text-[8px] font-bold">SECTION</span>
                        </div>
                      )}
                    </div>

                    {/* Section Info & Role Explanation */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{section.title}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${meta.badgeColor} flex items-center gap-1`}>
                          <MetaIcon className="w-3 h-3" />
                          {meta.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-slate-400" />
                          {meta.position}
                        </span>
                        {!section.is_active && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                            DRAFT / HIDDEN
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {section.subtitle || meta.description}
                      </div>

                      {/* Content Details */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] mt-1.5">
                        {section.section_type === 'curated_products' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-blue-700 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                              {section.product_ids?.length || section.config?.product_ids?.length
                                ? `${section.product_ids?.length || section.config?.product_ids?.length} Hand-picked Products`
                                : 'Catalogue Auto-Filter'}
                            </span>
                            <span className="text-slate-500 font-medium">
                              Tabs: {section.config?.tabs?.join(', ') || 'ALL, GEARS, APPAREL, FITNESS'}
                            </span>
                          </div>
                        ) : Array.isArray(section.items) && section.items.length > 0 ? (
                          <span className="text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                            {section.items.length} Curated Items
                          </span>
                        ) : section.cta_link ? (
                          <span className="text-primary-600 font-medium flex items-center gap-1">
                            <span>Button: <strong>{section.cta_text || 'Shop'}</strong></span>
                            <span className="text-slate-400 font-mono">({section.cta_link})</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                    <button
                      onClick={() => handleToggleActive(section)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        section.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {section.is_active ? '● Live' : '○ Draft'}
                    </button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleEditSection(section)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Configure Section
                    </Button>

                    <button
                      onClick={() => handleDeleteSection(section)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                      title="Delete section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          SECTION EDIT / CREATE MODAL (z-index: 1000)
          ========================================================================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          style={{ zIndex: 1000 }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-slate-900">
                    {editingSection ? `Configure "${editingSection.title}"` : 'Add Storefront Section'}
                  </h3>
                  {editingSection && SECTION_METADATA[editingSection.section_type] && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {SECTION_METADATA[editingSection.section_type].positionBadge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update customer-facing text, featured products, category tabs, and campaign banners.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSection} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Placement Explanation Card */}
              {editingSection && SECTION_METADATA[editingSection.section_type] && (
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Homepage Placement: </span>
                    <span>{SECTION_METADATA[editingSection.section_type].position}. </span>
                    <span className="text-indigo-700">{SECTION_METADATA[editingSection.section_type].description}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section Role / Type</label>
                  <select
                    value={formData.section_type}
                    onChange={(e) => setFormData({ ...formData, section_type: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    {Object.entries(SECTION_METADATA).map(([k, meta]) => (
                      <option key={k} value={k}>
                        {meta.name} ({meta.positionBadge})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Campaign Narrative</label>
                <textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* =========================================================================
                  SPECIALIZED INTERFACE: CURATED PRODUCTS SECTION (#3 See What's New Today)
                  ========================================================================= */}
              {formData.section_type === 'curated_products' ? (
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-blue-600" /> Curated Featured Products & Category Tabs
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Customize which categories appear as tabs and hand-pick the exact products to display.
                      </p>
                    </div>
                  </div>

                  {/* 1. Category Tabs Configurator */}
                  <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800">
                      1. Category Tabs to Display on Homepage
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Click to enable/disable which category filter tabs customers see above the products.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['ALL', ...storeCategories.map((c) => c.name)].map((catName) => {
                        const currentTabs = formData.config?.tabs || [];
                        const isChecked = currentTabs.includes(catName);
                        return (
                          <button
                            type="button"
                            key={catName}
                            onClick={() => {
                              const nextTabs = isChecked
                                ? currentTabs.filter((t) => t !== catName)
                                : [...currentTabs, catName];
                              setFormData({
                                ...formData,
                                config: { ...formData.config, tabs: nextTabs },
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                              isChecked
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            <span>{catName === 'ALL' ? 'All Equipment' : catName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Hand-Picked Featured Products Selector */}
                  <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-800">
                          2. Selected Products ({formData.product_ids?.length || 0} Products Picked)
                        </label>
                        <p className="text-[11px] text-slate-500">
                          {formData.product_ids?.length
                            ? 'Only the selected items will be shown to customers in this section.'
                            : 'No specific products selected. All active catalog items will show by default.'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => setShowProductPicker(true)}
                        leftIcon={<Plus className="w-4 h-4" />}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Pick Featured Products
                      </Button>
                    </div>

                    {/* Preview of Selected Products */}
                    {formData.product_ids?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                        {formData.product_ids.map((pId) => {
                          const prod = catalogueProducts.find(
                            (p) => String(p._id) === String(pId) || String(p.id) === String(pId)
                          );
                          if (!prod) return null;
                          return (
                            <div
                              key={pId}
                              className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded bg-white border border-slate-200 overflow-hidden shrink-0">
                                  {prod.images?.[0] ? (
                                    <img src={prod.images[0]} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-4 h-4 m-2 text-slate-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate">{prod.name}</div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                    <span className="px-1 rounded bg-slate-200 text-slate-700 font-bold">{prod.category}</span>
                                    <span>₹{(prod.price_paise || 0) / 100}</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleProductSelection(pId)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Remove from featured"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500 border border-dashed border-slate-300">
                        Click "Pick Featured Products" to choose exactly which products appear on your homepage.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* MEDIA CONFIGURATION (HERO OR PROMOTIONAL BANNER) */
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-emerald-600" /> Campaign Media & Video
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="modal_media_type"
                          value="image"
                          checked={formData.media_type === 'image'}
                          onChange={() => setFormData({ ...formData, media_type: 'image' })}
                        />
                        Image Banner
                      </label>
                      <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="modal_media_type"
                          value="video"
                          checked={formData.media_type === 'video'}
                          onChange={() => setFormData({ ...formData, media_type: 'video' })}
                        />
                        Video (MP4)
                      </label>
                    </div>
                  </div>

                  {/* 1. Primary Media URL */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Primary Media URL ({formData.media_type === 'video' ? 'MP4 Video' : 'Image'})
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => triggerDirectUpload('media_url')}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                          title="Upload file directly to Cloudinary"
                        >
                          <Upload className="w-3 h-3" /> Direct Upload
                        </button>
                        <button
                          type="button"
                          onClick={() => openMediaPicker('media_url')}
                          className="text-xs bg-primary-600 hover:bg-primary-700 text-white font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                          title="Select existing asset from gallery"
                        >
                          <FolderOpen className="w-3 h-3" /> Browse Gallery
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.media_url}
                      onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                      placeholder="https://res.cloudinary.com/..."
                      className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    />

                    {/* Primary Media Live Preview */}
                    {formData.media_url && (
                      <div className="mt-2 p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
                        <div className="w-24 h-16 bg-black rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                          {formData.media_type === 'video' ? (
                            <video src={formData.media_url} className="w-full h-full object-cover" controls muted />
                          ) : (
                            <img src={formData.media_url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active Media Preview
                          </span>
                          <div className="text-[11px] font-mono text-slate-500 truncate mt-1">
                            {formData.media_url}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Poster / Fallback URL */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Poster Image URL (Pre-playback cover & image fallback)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => triggerDirectUpload('poster_url')}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                          title="Upload poster directly to Cloudinary"
                        >
                          <Upload className="w-3 h-3" /> Direct Upload
                        </button>
                        <button
                          type="button"
                          onClick={() => openMediaPicker('poster_url')}
                          className="text-xs bg-primary-600 hover:bg-primary-700 text-white font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                          title="Select poster from gallery"
                        >
                          <FolderOpen className="w-3 h-3" /> Browse Gallery
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.poster_url}
                      onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                      placeholder="https://res.cloudinary.com/...poster.jpg"
                      className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    />

                    {/* Poster Live Preview */}
                    {formData.poster_url && (
                      <div className="mt-2 p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
                        <div className="w-24 h-16 bg-black rounded-lg overflow-hidden shrink-0">
                          <img src={formData.poster_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            Active Poster Preview
                          </span>
                          <div className="text-[11px] font-mono text-slate-500 truncate mt-1">
                            {formData.poster_url}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items List (for Collections Strip, Editorial Showcase, etc.) */}
              {Array.isArray(formData.items) && formData.items.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800 block">
                      Curated Section Items ({formData.items.length})
                    </span>
                    <span className="text-[11px] text-slate-500">Each card has its own image and destination link</span>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between text-xs font-black text-slate-800">
                          <span>Item #{idx + 1}: {item.title || item.name || 'Card'}</span>
                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Title / Discipline</label>
                            <input
                              type="text"
                              placeholder="Title (e.g. GEARS)"
                              value={item.title || item.name || ''}
                              onChange={(e) => {
                                const newItems = [...formData.items];
                                newItems[idx] = { ...newItems[idx], title: e.target.value };
                                setFormData({ ...formData, items: newItems });
                              }}
                              className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Click Destination Link</label>
                            <input
                              type="text"
                              placeholder="Link (e.g. /store?category=GEARS)"
                              value={item.link || item.cta_link || ''}
                              onChange={(e) => {
                                const newItems = [...formData.items];
                                newItems[idx] = { ...newItems[idx], link: e.target.value };
                                setFormData({ ...formData, items: newItems });
                              }}
                              className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 font-mono text-slate-600"
                            />
                          </div>
                        </div>

                        {/* Item Image with Direct Upload & Gallery buttons */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-500">Item Image</label>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => triggerDirectUpload(`item_${idx}`)}
                                className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded cursor-pointer flex items-center gap-1"
                              >
                                <Upload className="w-2.5 h-2.5" /> Upload Image
                              </button>
                              <button
                                type="button"
                                onClick={() => openMediaPicker(`item_${idx}`)}
                                className="text-[10px] bg-primary-600 hover:bg-primary-700 text-white font-bold px-2 py-0.5 rounded cursor-pointer flex items-center gap-1"
                              >
                                <FolderOpen className="w-2.5 h-2.5" /> Gallery
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.image && (
                              <div className="w-9 h-9 rounded-md overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <input
                              type="text"
                              placeholder="https://res.cloudinary.com/..."
                              value={item.image || ''}
                              onChange={(e) => {
                                const newItems = [...formData.items];
                                newItems[idx] = { ...newItems[idx], image: e.target.value };
                                setFormData({ ...formData, items: newItems });
                              }}
                              className="w-full text-xs font-mono px-2.5 py-1.5 rounded border border-slate-200 text-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Call to Action Button Text</label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    placeholder="e.g. Shop Store Catalog"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Button Link Destination</label>
                  <input
                    type="text"
                    value={formData.cta_link}
                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                    placeholder="e.g. /store or /catalogue"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Visibility Switch */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="section_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="section_is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Section is Published (Visible to customers on live homepage)
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="outline" size="md" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit" isLoading={savingSection}>
                  Save Section
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          PRODUCT PICKER MODAL (z-index: 3000 - Strictly above Section Edit Modal)
          ========================================================================= */}
      {showProductPicker && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          style={{ zIndex: 3000 }}
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl p-6 max-h-[88vh] flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" /> Curate Products for Homepage
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select which products will be featured on the homepage in "See What's New Today". ({formData.product_ids?.length || 0} selected)
                </p>
              </div>
              <button
                onClick={() => setShowProductPicker(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search product title, SKU..."
                  value={productPickerSearch}
                  onChange={(e) => setProductPickerSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-600">Category:</span>
                <select
                  value={productPickerCategory}
                  onChange={(e) => setProductPickerCategory(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="ALL">All Categories</option>
                  {storeCategories.map((c) => (
                    <option key={c.slug} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 py-3 overflow-y-auto flex-1 pr-1">
              {filteredCatalogueProducts.map((prod) => {
                const prodId = String(prod._id || prod.id);
                const isSelected = (formData.product_ids || []).some((id) => String(id) === prodId);

                return (
                  <div
                    key={prodId}
                    onClick={() => toggleProductSelection(prodId)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                      {prod.images?.[0] ? (
                        <img src={prod.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 truncate" title={prod.name}>
                        {prod.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
                          {prod.category}
                        </span>
                        <span className="text-xs font-black text-slate-800">
                          ₹{(prod.price_paise || 0) / 100}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="text-xs font-bold text-slate-600">
                {formData.product_ids?.length || 0} products selected for homepage display
              </div>
              <Button variant="primary" size="sm" onClick={() => setShowProductPicker(false)}>
                Done (Save Selection)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BROWSE MEDIA GALLERY MODAL (POPUP PICKER)
          z-index: 2000 (Strictly above Section Edit Modal)
          ========================================================================= */}
      {showMediaPicker && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          style={{ zIndex: 2000 }}
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl p-6 max-h-[88vh] flex flex-col border border-slate-200">
            {/* Picker Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-primary-600" />
                  {mediaPickerTarget === 'browse_only'
                    ? 'Cloudinary Media Gallery'
                    : `Pick Asset for: ${mediaPickerTarget.replace('item_', 'Item #').replace('_', ' ')}`}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {mediaPickerTarget === 'browse_only'
                    ? 'Click any asset to copy its Cloudinary URL, or upload new files.'
                    : `Click any image or video below to instantly assign it to this field.`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => triggerDirectUpload(mediaPickerTarget === 'browse_only' ? 'general' : mediaPickerTarget)}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Upload New
                </Button>
                <button
                  onClick={() => setShowMediaPicker(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Controls Bar: Search & Filter Tabs */}
            <div className="py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search assets by name or tag..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPickerTypeFilter('ALL')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    pickerTypeFilter === 'ALL' ? 'bg-white shadow-xs text-slate-900 font-black' : 'text-slate-500'
                  }`}
                >
                  All ({mediaAssets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPickerTypeFilter('image')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    pickerTypeFilter === 'image' ? 'bg-white shadow-xs text-slate-900 font-black' : 'text-slate-500'
                  }`}
                >
                  Images
                </button>
                <button
                  type="button"
                  onClick={() => setPickerTypeFilter('video')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    pickerTypeFilter === 'video' ? 'bg-white shadow-xs text-slate-900 font-black' : 'text-slate-500'
                  }`}
                >
                  Videos
                </button>
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-3 overflow-y-auto flex-1">
              {filteredPickerAssets.map((asset) => (
                <div
                  key={asset.media_id || asset.id}
                  onClick={() => handleSelectAsset(asset)}
                  className="border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-primary-500 hover:shadow-md transition-all group flex flex-col bg-white"
                >
                  <div className="aspect-video bg-black flex items-center justify-center relative overflow-hidden">
                    {asset.media_type === 'video' ? (
                      <>
                        {asset.poster_url ? (
                          <img src={asset.poster_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Film className="w-6 h-6 text-indigo-400" />
                        )}
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[8px] text-white font-bold flex items-center gap-0.5">
                          <Film className="w-2.5 h-2.5" /> MP4
                        </span>
                      </>
                    ) : (
                      <img
                        src={asset.url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <div className="p-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 truncate" title={asset.display_name}>
                        {asset.display_name}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                        {asset.width && asset.height ? `${asset.width}x${asset.height}` : asset.media_type}
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-primary-600 font-bold">
                      {mediaPickerTarget === 'browse_only' ? (
                        <>
                          <span>{copiedUrl === asset.url ? 'Copied!' : 'Copy URL'}</span>
                          {copiedUrl === asset.url ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-primary-600" />
                          )}
                        </>
                      ) : (
                        <>
                          <span>Select Asset</span>
                          <Check className="w-3.5 h-3.5" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <Button variant="outline" size="sm" onClick={() => setShowMediaPicker(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
