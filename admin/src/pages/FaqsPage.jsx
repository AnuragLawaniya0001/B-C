import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  HelpCircle,
  Plus,
  CheckCircle2,
  Trash2,
  Edit,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';

export default function FaqsPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    category: 'membership',
    question: '',
    answer: '',
    order: 1,
    active: true,
  });

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faqs?include_inactive=true');
      const data = res.data || res;
      setFaqs(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to load FAQs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const openCreateModal = () => {
    setEditingFaq(null);
    setFormData({
      category: 'membership',
      question: '',
      answer: '',
      order: (faqs.length || 0) + 1,
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (f) => {
    setEditingFaq(f);
    setFormData({
      category: f.category || 'membership',
      question: f.question || '',
      answer: f.answer || '',
      order: f.order || 1,
      active: f.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      if (editingFaq) {
        const faqId = editingFaq._id || editingFaq.id;
        await api.put(`/faqs/${faqId}`, formData);
        setStatusMessage({ type: 'success', text: `FAQ updated successfully!` });
      } else {
        await api.post('/faqs', formData);
        setStatusMessage({ type: 'success', text: `New FAQ created successfully!` });
      }
      setIsModalOpen(false);
      fetchFaqs();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Operation failed';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (f) => {
    const faqId = f._id || f.id;
    if (!window.confirm(`Are you sure you want to delete this FAQ?`)) return;
    try {
      await api.delete(`/faqs/${faqId}`);
      setStatusMessage({ type: 'success', text: `FAQ deleted successfully` });
      fetchFaqs();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to delete FAQ';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary-600" /> FAQs Manager ({faqs.length})
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Dynamic-First FAQs: Categorized questions and answers stored in MongoDB{' '}
            <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">faqs</code> collection.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add New FAQ
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
          <span>Loading FAQs from database...</span>
        </Card>
      ) : faqs.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          <p>No FAQs found in database. Click &quot;Add New FAQ&quot; to create one.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {faqs.map((faq, idx) => (
            <Card
              key={faq._id || idx}
              className="p-5 space-y-2 hover:border-primary-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded bg-primary-100 text-primary-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {faq.order || idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{faq.question}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                    {faq.category}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                      faq.active !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" /> {faq.active !== false ? 'Active' : 'Inactive'}
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => openEditModal(faq)} leftIcon={<Edit className="w-3.5 h-3.5" />}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(faq)}
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
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
                {editingFaq ? 'Edit FAQ' : 'Create New FAQ'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="membership">membership</option>
                    <option value="cookey">cookey</option>
                    <option value="army">army</option>
                    <option value="dormitory">dormitory</option>
                    <option value="physio">physio</option>
                    <option value="general">general</option>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question</label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g. How do I renew my Bigchamp card?"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Answer</label>
                <textarea
                  rows={4}
                  required
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Detailed explanation..."
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="faqActiveToggle"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded border-slate-300"
                />
                <label htmlFor="faqActiveToggle" className="text-xs font-medium text-slate-700">
                  FAQ is Active and Visible to Customers
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : editingFaq ? 'Update FAQ' : 'Create FAQ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
