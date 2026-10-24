import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  ArrowLeft,
  Save,
  Layers,
  Sparkles,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import api from '../services/api';

export default function PageEditorPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/pages/${slug}`);
      const data = res.data || res;
      setPage(data);
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Failed to load page '${slug}'` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      const payload = {
        title: page.title,
        meta: page.meta || {},
        sections: page.sections || [],
        active: page.active !== false,
      };
      const res = await api.put(`/pages/${slug}`, payload);
      const updated = res.data || res;
      setPage(updated);
      setStatusMessage({
        type: 'success',
        text: `Page '${slug}' successfully updated in MongoDB!`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to update page';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const updateMeta = (field, value) => {
    setPage((prev) => ({
      ...prev,
      meta: {
        ...(prev.meta || {}),
        [field]: value,
      },
    }));
  };

  const toggleSection = (index) => {
    setPage((prev) => {
      const sections = [...(prev.sections || [])];
      sections[index] = { ...sections[index], enabled: !sections[index].enabled };
      return { ...prev, sections };
    });
  };

  const updateSectionTitle = (index, title) => {
    setPage((prev) => {
      const sections = [...(prev.sections || [])];
      sections[index] = {
        ...sections[index],
        content: { ...(sections[index].content || {}), title },
      };
      return { ...prev, sections };
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link to="/pages">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Pages
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary-600" /> Page Editor:{' '}
            <span className="font-mono text-primary-700">{slug}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Dynamic layout builder &bull; Section toggling, ordering & content stored in MongoDB{' '}
            <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">pages</code> collection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || loading}
            rightIcon={<Save className="w-4 h-4" />}
          >
            {saving ? 'Saving to Database...' : 'Save Page'}
          </Button>
        </div>
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
          <span>Loading page layout from database...</span>
        </Card>
      ) : !page ? (
        <Card className="p-8 text-center text-slate-500">
          <p>Page not found in MongoDB.</p>
        </Card>
      ) : (
        <>
          {/* General Page Settings */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Page Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Page Title</label>
                <input
                  type="text"
                  value={page.title || ''}
                  onChange={(e) => setPage((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={page.active !== false ? 'active' : 'inactive'}
                  onChange={(e) => setPage((prev) => ({ ...prev, active: e.target.value === 'active' }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800"
                >
                  <option value="active">Published / Active</option>
                  <option value="inactive">Draft / Hidden</option>
                </select>
              </div>
            </div>
          </Card>

          {/* SEO & Meta Details */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-600" /> SEO & Meta Tags
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Page Meta Title</label>
                <input
                  type="text"
                  value={page.meta?.title || ''}
                  onChange={(e) => updateMeta('title', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800"
                  placeholder="e.g. Bigchamp — India's First Sports Ecosystem"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">OpenGraph Image URL</label>
                <input
                  type="text"
                  value={page.meta?.og_image || ''}
                  onChange={(e) => updateMeta('og_image', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800"
                  placeholder="e.g. /images/og-home.jpg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meta Description</label>
                <textarea
                  rows={2}
                  value={page.meta?.description || ''}
                  onChange={(e) => updateMeta('description', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800"
                  placeholder="Describe the page for Google SEO"
                />
              </div>
            </div>
          </Card>

          {/* Dynamic Sections Manager */}
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600" /> Dynamic Sections & Content Blocks
              </h2>
              <p className="text-xs text-slate-500">
                Enable or disable dynamic component sections. Changes update the public frontend immediately.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {(page.sections || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No dynamic sections defined for this page.</p>
              ) : (
                page.sections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="p-4 border rounded-lg bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-primary-100 text-primary-800 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          {sec.id.toUpperCase()} SECTION (type: &quot;{sec.type}&quot;)
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            sec.enabled !== false
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {sec.enabled !== false ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="pl-8">
                        <input
                          type="text"
                          value={sec.content?.title || sec.content?.headline || ''}
                          onChange={(e) => updateSectionTitle(idx, e.target.value)}
                          placeholder="Section headline / title"
                          className="text-xs px-2.5 py-1.5 border rounded bg-white text-slate-800 w-full sm:w-80 mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => toggleSection(idx)}
                        className={`text-xs px-3 py-1.5 rounded font-semibold transition-colors ${
                          sec.enabled !== false
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {sec.enabled !== false ? 'Disable Section' : 'Enable Section'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
