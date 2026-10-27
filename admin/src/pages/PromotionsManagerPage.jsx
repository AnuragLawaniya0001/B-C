import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Clock,
  ShieldCheck,
  Tag,
  Sliders,
  Smartphone,
  Monitor,
} from 'lucide-react';
import api from '../services/api';

export default function PromotionsManagerPage() {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'

  const [formData, setFormData] = useState({
    popup_id: '',
    name: '',
    headline: '',
    subheadline: '',
    cta_text: 'Claim Offer',
    cta_link: '/offers',
    discount_code: 'CHAMPION15',
    discount_badge: '15% OFF',
    media_url: '',
    poster_url: '',
    frequency_delay_seconds: 3,
    suppression_days: 3,
    priority: 10,
    is_active: true,
    layout_variant: 'hero_card',
  });

  const fetchPopups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/promotions/popups');
      const data = res.data || res;
      setPopups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load popup campaigns:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load promotional popup campaigns.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  const handleEdit = (p) => {
    setEditingPopup(p);
    setFormData({
      popup_id: p.popup_id,
      name: p.name || '',
      headline: p.headline || '',
      subheadline: p.subheadline || '',
      cta_text: p.cta_text || 'Claim Offer',
      cta_link: p.cta_link || '/offers',
      discount_code: p.discount_code || '',
      discount_badge: p.discount_badge || '',
      media_url: p.media_url || '',
      poster_url: p.poster_url || '',
      frequency_delay_seconds: p.frequency_delay_seconds || 3,
      suppression_days: p.suppression_days || 3,
      priority: p.priority || 10,
      is_active: p.is_active !== false,
      layout_variant: p.layout_variant || 'hero_card',
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingPopup(null);
    setFormData({
      popup_id: `pop_${Date.now()}`,
      name: 'Seasonal Flash Sale',
      headline: 'UNLOCK 20% OFF YOUR FIRST ORDER',
      subheadline: 'Join the Bigchamp elite athlete community today. Use code at checkout.',
      cta_text: 'Claim 20% Off',
      cta_link: '/offers',
      discount_code: 'BIGCHAMP20',
      discount_badge: '20% OFF',
      media_url: '/uploads/media/images/editorial_fitness_gear_1793006567583.jpg',
      poster_url: '',
      frequency_delay_seconds: 4,
      suppression_days: 3,
      priority: 10,
      is_active: true,
      layout_variant: 'hero_card',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingPopup) {
        await api.put(`/admin/promotions/popups/${editingPopup.popup_id}`, formData);
        setStatusMessage({ type: 'success', text: `Popup campaign "${formData.name}" updated.` });
      } else {
        await api.post('/admin/promotions/popups', formData);
        setStatusMessage({ type: 'success', text: `New popup campaign "${formData.name}" created.` });
      }
      setIsModalOpen(false);
      await fetchPopups();
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Save failed.';
      setStatusMessage({ type: 'error', text: `Failed to save popup campaign: ${errMsg}` });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete popup campaign "${p.name}"?`)) return;
    try {
      await api.delete(`/admin/promotions/popups/${p.popup_id}`);
      setStatusMessage({ type: 'success', text: 'Popup campaign deleted.' });
      await fetchPopups();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to delete popup campaign.' });
    }
  };

  const handleToggleActive = async (p) => {
    try {
      const updated = !p.is_active;
      await api.put(`/admin/promotions/popups/${p.popup_id}`, {
        ...p,
        is_active: updated,
      });
      setStatusMessage({
        type: 'success',
        text: `Popup "${p.name}" is now ${updated ? 'Active & Eligible for Rotation' : 'Paused / Inactive'}.`,
      });
      await fetchPopups();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update popup status.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Smart Promotional Popups</h1>
            <Badge variant="primary" className="bg-primary-950 text-white font-bold">Phase 6.3</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configurable, mobile-safe modal campaigns with fair multi-campaign rotation, frequency triggers, suppression periods, and 1-click offer claiming.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchPopups} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleCreate}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-primary-900 text-white hover:bg-primary-800"
          >
            Create Popup Campaign
          </Button>
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            statusMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Popups Table & Cards */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-500 mb-2" />
          <p className="text-sm">Loading smart popup campaigns...</p>
        </div>
      ) : popups.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No popup campaigns found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Create an admin-managed popup campaign with frequency limits and fair rotation.
          </p>
          <Button variant="primary" size="sm" onClick={handleCreate} className="mt-4">
            Create Campaign
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {popups.map((p) => (
            <Card
              key={p.popup_id}
              className={`p-5 bg-white border transition-all ${
                p.is_active ? 'border-slate-200 shadow-sm' : 'border-dashed border-slate-300 bg-slate-50 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {p.media_url ? (
                    <img src={p.media_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                      <Tag className="w-6 h-6 text-primary-400" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-base">{p.name}</span>
                      {p.discount_badge && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-black">
                          {p.discount_badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">{p.headline}</div>
                    <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{p.subheadline}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(p)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                      p.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {p.is_active ? 'Active' : 'Paused'}
                  </button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Behavior & Frequency Pills */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Delay Trigger</span>
                  <span className="font-bold text-slate-800">{p.frequency_delay_seconds || 3}s on page</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Suppression</span>
                  <span className="font-bold text-slate-800">{p.suppression_days || 3} days</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Promo Code</span>
                  <span className="font-mono font-bold text-primary-600">{p.discount_code || 'None'}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* =========================================================================
          CREATE / EDIT POPUP MODAL WITH LIVE PREVIEW
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  {editingPopup ? `Edit Popup "${editingPopup.name}"` : 'Create Smart Promotional Popup'}
                </h3>
                <p className="text-xs text-slate-500">
                  Controls presentation, discount badges, frequency limits, and fair rotation.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Screen: Form on Left, Live Preview on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-hidden">
              {/* Left: Configuration Form */}
              <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 border-r border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Name (Internal) *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Discount Code</label>
                    <input
                      type="text"
                      value={formData.discount_code}
                      onChange={(e) => setFormData({ ...formData, discount_code: e.target.value.toUpperCase() })}
                      className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={formData.discount_badge}
                      onChange={(e) => setFormData({ ...formData, discount_badge: e.target.value })}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Headline *</label>
                  <input
                    type="text"
                    required
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    className="w-full text-sm font-bold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subheadline / Description</label>
                  <textarea
                    rows={2}
                    value={formData.subheadline}
                    onChange={(e) => setFormData({ ...formData, subheadline: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Poster Image URL</label>
                  <input
                    type="text"
                    value={formData.media_url}
                    onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CTA Text</label>
                    <input
                      type="text"
                      value={formData.cta_text}
                      onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CTA Destination</label>
                    <input
                      type="text"
                      value={formData.cta_link}
                      onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Timing & Suppression */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Trigger Delay (Sec)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={formData.frequency_delay_seconds}
                      onChange={(e) => setFormData({ ...formData, frequency_delay_seconds: parseInt(e.target.value) || 3 })}
                      className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Suppression (Days)</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={formData.suppression_days}
                      onChange={(e) => setFormData({ ...formData, suppression_days: parseInt(e.target.value) || 3 })}
                      className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="popup_is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="popup_is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Enable Campaign for Fair Rotation
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button variant="outline" size="md" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="md" type="submit" isLoading={saving}>
                    Save Campaign
                  </Button>
                </div>
              </form>

              {/* Right: Interactive Desktop / Mobile Preview */}
              <div className="p-6 bg-slate-100 flex flex-col items-center justify-center overflow-y-auto">
                {/* Device Selector */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 mb-4 shadow-xs">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 ${
                      previewDevice === 'desktop' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" /> Desktop
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 ${
                      previewDevice === 'mobile' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Mobile
                  </button>
                </div>

                {/* Simulated Modal Card */}
                <div
                  className={`bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 transition-all ${
                    previewDevice === 'desktop' ? 'max-w-md w-full' : 'max-w-xs w-full'
                  }`}
                >
                  {/* Poster Image */}
                  <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    {formData.media_url ? (
                      <img src={formData.media_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-500 text-xs">No image selected</div>
                    )}
                    {formData.discount_badge && (
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black shadow-lg">
                        {formData.discount_badge}
                      </div>
                    )}
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 text-center space-y-3">
                    <h4 className="font-black text-lg text-slate-900 leading-tight">
                      {formData.headline || 'Headline Preview'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {formData.subheadline || 'Subheadline and terms preview text...'}
                    </p>

                    {formData.discount_code && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-dashed border-slate-300 font-mono font-bold text-sm text-primary-700 flex items-center justify-center gap-2">
                        <span>{formData.discount_code}</span>
                        <span className="text-[10px] bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded font-sans uppercase">
                          Copy
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      className="w-full py-2.5 rounded-xl bg-primary-950 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-primary-900"
                    >
                      {formData.cta_text || 'Claim Offer'}
                    </button>
                    <div className="text-[10px] text-slate-400">
                      Auto-suppresses for {formData.suppression_days} days on dismissal
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
