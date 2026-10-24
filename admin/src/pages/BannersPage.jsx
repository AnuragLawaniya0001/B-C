import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Image,
  Plus,
  Calendar,
  Tag,
  CheckCircle2,
  Trash2,
  Edit,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    position: 'homepage_top',
    link: '/membership',
    image_url: '/images/banners/banner-default.jpg',
    order: 1,
    active: true,
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/banners?include_inactive=true');
      const data = res.data || res;
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to load promotional banners' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      position: 'homepage_top',
      link: '/membership',
      image_url: '/images/banners/banner-default.jpg',
      order: (banners.length || 0) + 1,
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (b) => {
    setEditingBanner(b);
    setFormData({
      title: b.title || '',
      position: b.position || 'homepage_top',
      link: b.link || '/',
      image_url: b.image_url || '',
      order: b.order || 1,
      active: b.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      if (editingBanner) {
        const bannerId = editingBanner._id || editingBanner.id;
        await api.put(`/banners/${bannerId}`, formData);
        setStatusMessage({ type: 'success', text: `Banner '${formData.title}' updated successfully!` });
      } else {
        await api.post('/banners', formData);
        setStatusMessage({ type: 'success', text: `New banner '${formData.title}' created successfully!` });
      }
      setIsModalOpen(false);
      fetchBanners();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Operation failed';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b) => {
    const bannerId = b._id || b.id;
    if (!window.confirm(`Are you sure you want to delete banner "${b.title}"?`)) return;
    try {
      await api.delete(`/banners/${bannerId}`);
      setStatusMessage({ type: 'success', text: `Banner deleted successfully` });
      fetchBanners();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to delete banner';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Image className="w-6 h-6 text-primary-600" /> Promotional Banners ({banners.length})
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Dynamic-First Banners: Live promotions retrieved and updated directly in MongoDB{' '}
            <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">banners</code> collection.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add New Banner
        </Button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {loading ? (
        <Card className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
          <span>Loading banners from MongoDB...</span>
        </Card>
      ) : banners.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          <p>No banners found in database. Click &quot;Add New Banner&quot; to create one.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {banners.map((b) => (
            <Card
              key={b._id || b.title}
              className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-primary-200 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <Image className="w-6 h-6 text-primary-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{b.title}</h3>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                        b.active !== false
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> {b.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-primary-600" />
                      Position: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{b.position}</code>
                    </span>
                    <span>
                      Target: <code className="text-primary-600">{b.link}</code>
                    </span>
                    <span>Order: {b.order || 1}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button variant="secondary" size="sm" onClick={() => openEditModal(b)} leftIcon={<Edit className="w-3.5 h-3.5" />}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(b)}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingBanner ? 'Edit Promotional Banner' : 'Create New Promotional Banner'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Banner Headline</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Cookey — Members Only ₹100"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Position Slot</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="homepage_top">homepage_top</option>
                    <option value="homepage_middle">homepage_middle</option>
                    <option value="store_top">store_top</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Link URL</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="e.g. /cookey or /membership"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Image Asset Path / URL</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="/images/banners/banner-1.jpg"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded border-slate-300"
                />
                <label htmlFor="activeToggle" className="text-xs font-medium text-slate-700">
                  Banner is Active and Visible
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
