import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Tag,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Calendar,
  Sparkles,
  Copy,
  Percent,
  Coins,
  ShieldCheck,
  Check,
} from 'lucide-react';
import api from '../services/api';

export default function OffersCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Status & Feedback
  const [statusMessage, setStatusMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'PERCENTAGE',
    discount_value: '',
    min_order_rupees: '',
    max_discount_rupees: '',
    applicable_categories: [],
    total_usage_limit: '',
    per_user_limit: 1,
    start_date: '',
    end_date: '',
    active: true,
  });

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const data = res.data || res;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      let url = '/coupons?limit=100';
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      if (typeFilter !== 'ALL') {
        url += `&discount_type=${encodeURIComponent(typeFilter)}`;
      }
      if (statusFilter !== 'ALL') {
        url += `&status_filter=${encodeURIComponent(statusFilter)}`;
      }

      const res = await api.get(url);
      const data = res.data || res;
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to load offers and coupons' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [searchQuery, typeFilter, statusFilter]);

  const showFeedback = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const copyToClipboard = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      discount_type: 'PERCENTAGE',
      discount_value: '10',
      min_order_rupees: '500',
      max_discount_rupees: '500',
      applicable_categories: [],
      total_usage_limit: '500',
      per_user_limit: 1,
      start_date: '',
      end_date: '',
      active: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCoupon(c);
    const isPct = c.discount_type === 'PERCENTAGE';
    setFormData({
      code: c.code || '',
      name: c.name || '',
      description: c.description || '',
      discount_type: c.discount_type || 'PERCENTAGE',
      discount_value: isPct
        ? String(c.discount_value || '')
        : String((c.discount_value || 0) / 100),
      min_order_rupees: c.min_order_paise ? String(c.min_order_paise / 100) : '',
      max_discount_rupees: c.max_discount_paise ? String(c.max_discount_paise / 100) : '',
      applicable_categories: c.applicable_categories || [],
      total_usage_limit: c.total_usage_limit ? String(c.total_usage_limit) : '',
      per_user_limit: c.per_user_limit || 1,
      start_date: c.start_date ? c.start_date.substring(0, 10) : '',
      end_date: c.end_date ? c.end_date.substring(0, 10) : '',
      active: c.active !== false,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCategoryToggle = (catName) => {
    setFormData((prev) => {
      const exists = prev.applicable_categories.includes(catName);
      if (exists) {
        return {
          ...prev,
          applicable_categories: prev.applicable_categories.filter((c) => c !== catName),
        };
      }
      return {
        ...prev,
        applicable_categories: [...prev.applicable_categories, catName],
      };
    });
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.code.trim()) errors.code = 'Coupon code is required';
    if (!formData.name.trim()) errors.name = 'Offer name is required';

    const valNum = Number(formData.discount_value);
    if (!formData.discount_value || isNaN(valNum) || valNum <= 0) {
      errors.discount_value = 'Discount value must be greater than 0';
    } else if (formData.discount_type === 'PERCENTAGE' && valNum > 100) {
      errors.discount_value = 'Percentage discount cannot exceed 100%';
    }

    if (formData.start_date && formData.end_date && formData.end_date <= formData.start_date) {
      errors.end_date = 'End date must be after start date';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setActionLoading(true);

      const isPct = formData.discount_type === 'PERCENTAGE';
      const discountValuePaiseOrPct = isPct
        ? Number(formData.discount_value)
        : Math.round(Number(formData.discount_value) * 100);

      const minOrderPaise = formData.min_order_rupees
        ? Math.round(Number(formData.min_order_rupees) * 100)
        : 0;

      const maxDiscountPaise = formData.max_discount_rupees
        ? Math.round(Number(formData.max_discount_rupees) * 100)
        : null;

      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        discount_type: formData.discount_type,
        discount_value: discountValuePaiseOrPct,
        min_order_paise: minOrderPaise,
        max_discount_paise: maxDiscountPaise,
        applicable_categories: formData.applicable_categories,
        total_usage_limit: formData.total_usage_limit ? Number(formData.total_usage_limit) : null,
        per_user_limit: Number(formData.per_user_limit) || 1,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        active: formData.active,
      };

      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon._id || editingCoupon.code}`, payload);
        showFeedback('success', `Coupon '${payload.code}' updated successfully!`);
      } else {
        await api.post('/coupons', payload);
        showFeedback('success', `Coupon '${payload.code}' created successfully!`);
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to save coupon';
      showFeedback('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (c) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/coupons/${c._id || c.code}/toggle-active`);
      const updated = res.data || res;
      showFeedback('success', `Coupon '${c.code}' is now ${updated.active ? 'Active' : 'Inactive'}.`);
      fetchCoupons();
    } catch (err) {
      showFeedback('error', 'Failed to toggle coupon status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCoupon = async (c) => {
    if (!window.confirm(`Are you sure you want to delete coupon '${c.code}'?`)) return;

    try {
      setActionLoading(true);
      await api.delete(`/coupons/${c._id || c.code}?hard_delete=true`);
      showFeedback('success', `Coupon '${c.code}' deleted.`);
      fetchCoupons();
    } catch (err) {
      showFeedback('error', 'Failed to delete coupon');
    } finally {
      setActionLoading(false);
    }
  };

  // KPI counts
  const totalCount = coupons.length;
  const activeCount = coupons.filter((c) => c.status === 'ACTIVE').length;
  const scheduledCount = coupons.filter((c) => c.status === 'SCHEDULED').length;
  const expiredCount = coupons.filter((c) => c.status === 'EXPIRED' || c.status === 'INACTIVE').length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-7 h-7 text-primary-600" /> Offers & Coupons Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Authoritative promotional vouchers, percentage and flat discounts, eligibility rules, and usage ceilings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
            Create New Offer
          </Button>
        </div>
      </div>

      {/* Status Feedback Banner */}
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

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Coupons</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active & Redeemable</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Scheduled / Upcoming</p>
          <p className="text-2xl font-bold text-sky-700 mt-1">{scheduledCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expired / Inactive</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">{expiredCount}</p>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code (e.g. WELCOME10), offer name, or rule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Discount:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium border rounded-lg bg-white text-slate-800"
            >
              <option value="ALL">All Types</option>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED_AMOUNT">Flat Amount (₹)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium border rounded-lg bg-white text-slate-800"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="EXPIRED">Expired</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchCoupons}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reload
          </Button>
        </div>
      </Card>

      {/* Offers List */}
      {loading ? (
        <Card className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
          <span>Loading offers and coupons...</span>
        </Card>
      ) : coupons.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No coupons match your filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            Click &quot;Create New Offer&quot; to add a promotional discount voucher.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Offer Name & Eligibility</th>
                <th className="py-3 px-4">Discount Value</th>
                <th className="py-3 px-4">Min Order / Cap</th>
                <th className="py-3 px-4">Usage & Dates</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((c) => {
                const isPct = c.discount_type === 'PERCENTAGE';
                const discountDisplay = isPct
                  ? `${c.discount_value}% OFF`
                  : `₹${((c.discount_value || 0) / 100).toFixed(2)} FLAT`;

                const minOrderDisplay = c.min_order_paise
                  ? `Min ₹${(c.min_order_paise / 100).toFixed(2)}`
                  : 'No minimum';

                const capDisplay =
                  isPct && c.max_discount_paise
                    ? `Cap: ₹${(c.max_discount_paise / 100).toFixed(2)}`
                    : null;

                const statusColor = {
                  ACTIVE: 'success',
                  SCHEDULED: 'info',
                  EXPIRED: 'warning',
                  INACTIVE: 'default',
                }[c.status] || 'default';

                return (
                  <tr key={c._id || c.code} className="hover:bg-slate-50/70 transition-colors">
                    {/* Coupon Code Badge */}
                    <td className="py-3.5 px-4 font-mono font-black text-sm">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-900 border border-primary-200 tracking-wider">
                          {c.code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(c.code)}
                          className="text-slate-400 hover:text-primary-600"
                          title="Copy code"
                        >
                          {copiedCode === c.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Offer Name & Target Categories */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      {c.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.applicable_categories && c.applicable_categories.length > 0 ? (
                          c.applicable_categories.map((cat) => (
                            <span
                              key={cat}
                              className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700"
                            >
                              {cat}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">All Store Categories</span>
                        )}
                      </div>
                    </td>

                    {/* Discount Value */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-xs font-extrabold">
                        {isPct ? <Percent className="w-3 h-3" /> : <Coins className="w-3 h-3" />}
                        {discountDisplay}
                      </span>
                    </td>

                    {/* Min Order & Cap */}
                    <td className="py-3.5 px-4 text-xs text-slate-700 space-y-0.5">
                      <div>{minOrderDisplay}</div>
                      {capDisplay && <div className="text-slate-400 font-mono text-[11px]">{capDisplay}</div>}
                    </td>

                    {/* Usage & Dates */}
                    <td className="py-3.5 px-4 text-xs text-slate-600 space-y-0.5">
                      <div>
                        Used:{' '}
                        <span className="font-bold text-slate-800">{c.times_used || 0}</span>
                        {c.total_usage_limit ? ` / ${c.total_usage_limit}` : ' (Unlimited)'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {c.end_date ? `Ends: ${c.end_date.substring(0, 10)}` : 'No expiry'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge variant={statusColor} size="sm">
                        {c.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit offer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(c)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            c.active
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={c.active ? 'Deactivate offer' : 'Activate offer'}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete offer"
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

      {/* ========================================================= */}
      {/* CREATE / EDIT OFFER MODAL */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary-600" />
                {editingCoupon ? `Edit Offer: ${editingCoupon.code}` : 'Create New Promotional Offer'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCoupon} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Coupon Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. FESTIVAL20, BIGCHAMP500"
                    className={`w-full px-3 py-2 text-sm border font-mono font-bold uppercase rounded-lg ${
                      formErrors.code ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.code && <p className="text-xs text-rose-600 mt-1">{formErrors.code}</p>}
                </div>

                {/* Offer Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Offer Headline *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Festival 20% Off All Sports Gear"
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${
                      formErrors.name ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
                </div>

                {/* Discount Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type *</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="PERCENTAGE">Percentage Discount (%)</option>
                    <option value="FIXED_AMOUNT">Flat Amount Discount (₹)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.discount_type === 'PERCENTAGE'
                      ? 'Discount Percentage (%) *'
                      : 'Flat Discount in Rupees (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'PERCENTAGE' ? 'e.g. 20 for 20%' : 'e.g. 200 for ₹200'}
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${
                      formErrors.discount_value ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.discount_value && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.discount_value}</p>
                  )}
                </div>

                {/* Min Order Value */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Order Value (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_order_rupees}
                    onChange={(e) => setFormData({ ...formData, min_order_rupees: e.target.value })}
                    placeholder="e.g. 1000 (0 = no minimum)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Max Discount Cap (for percentage) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Discount Cap in ₹ (Percentage only)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={formData.discount_type === 'FIXED_AMOUNT'}
                    value={formData.max_discount_rupees}
                    onChange={(e) => setFormData({ ...formData, max_discount_rupees: e.target.value })}
                    placeholder="e.g. 500 (blank = uncapped)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg disabled:bg-slate-100"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${
                      formErrors.end_date ? 'border-rose-500' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.end_date && <p className="text-xs text-rose-600 mt-1">{formErrors.end_date}</p>}
                </div>

                {/* Total Usage Limit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Global Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_usage_limit}
                    onChange={(e) => setFormData({ ...formData, total_usage_limit: e.target.value })}
                    placeholder="e.g. 500 (blank = unlimited)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Per User Limit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Per-User Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.per_user_limit}
                    onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Terms & Conditions</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Valid once per customer on badminton and cricket gear."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Category Selection */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Applicable Categories (Leave unchecked for All Categories)
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {categories.map((cat) => {
                      const selected = formData.applicable_categories.includes(cat.name);
                      return (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() => handleCategoryToggle(cat.name)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            selected
                              ? 'bg-primary-900 text-white shadow-sm'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 rounded text-primary-600"
                    />
                    <span className="text-xs font-bold text-slate-800">Offer Active & Redeemable</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Live Summary Preview */}
              <div className="p-3 bg-primary-50/60 border border-primary-200 rounded-xl text-xs text-primary-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Sparkles className="w-3.5 h-3.5" /> Live Rule Summary
                </span>
                <p className="leading-relaxed">
                  Code <strong className="font-mono">{formData.code || 'CODE'}</strong> provides{' '}
                  <strong>
                    {formData.discount_type === 'PERCENTAGE'
                      ? `${formData.discount_value || 0}% off`
                      : `₹${formData.discount_value || 0} flat off`}
                  </strong>
                  {formData.discount_type === 'PERCENTAGE' && formData.max_discount_rupees
                    ? ` (capped at ₹${formData.max_discount_rupees})`
                    : ''}
                  {formData.min_order_rupees
                    ? ` on orders of ₹${formData.min_order_rupees} or above`
                    : ''}
                  {formData.applicable_categories.length > 0
                    ? ` in ${formData.applicable_categories.join(', ')}`
                    : ' across all products'}
                  .
                </p>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={actionLoading}
                  leftIcon={actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                >
                  {actionLoading ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Create Offer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
