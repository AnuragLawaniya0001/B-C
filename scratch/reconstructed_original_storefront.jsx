import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import api from '../services/api';
27: const SECTION_TYPE_LABELS = {
hero_campaign: 'Hero Campaign (Video / Image Banner)',
collections_strip: 'Collections Circular Strip',
curated_products: 'Curated Products Carousel / Grid',
editorial_showcase: 'Editorial 3-Card Showcase',
seasonal_sale_banner: 'Seasonal Campaign / Video Banner',
athlete_testimonials: 'Athlete Testimonials & Reviews',
community_feed: 'Community & Athlete Photo Feed',
trust_pillars: 'Brand Trust & Guarantee Pillars',
};
38: export default function StorefrontBuilderPage() {
const [sections, setSections] = useState([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [statusMessage, setStatusMessage] = useState(null);
44:   // Available Media Assets (for Quick Picker)
const [mediaAssets, setMediaAssets] = useState([]);
const [showMediaPicker, setShowMediaPicker] = useState(false);
const [mediaPickerTarget, setMediaPickerTarget] = useState('media_url'); // 'media_url' | 'poster_url'
49:   // Edit / Create Section Modal State
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingSection, setEditingSection] = useState(null);
const [formData, setFormData] = useState({
section_id: '',
title: '',
subtitle: '',
section_type: 'hero_campaign',
media_url: '',
poster_url: '',
media_type: 'image',
cta_text: 'Explore Collection',
cta_link: '/catalogue',
is_active: true,
display_order: 1,
items: [],
});
67:   // Fetch sections
const fetchSections = async () => {
try {
setLoading(true);
const res = await api.get('/admin/storefront/sections');
const data = res.data || res;
setSections(Array.isArray(data) ? data : []);
} catch (err) {
console.error('Failed to load storefront sections:', err);
setStatusMessage({ type: 'error', text: 'Failed to load storefront configuration.' });
} finally {
setLoading(false);
}
};
82:   // Fetch Media Assets for selection
const fetchMediaAssets = async () => {
try {
const res = await api.get('/media?include_archived=false');
const data = res.data || res;
setMediaAssets(Array.isArray(data) ? data : []);
} catch (err) {
console.error('Failed to load media for picker:', err);
}
};
93:   useEffect(() => {
fetchSections();
fetchMediaAssets();
}, []);
98:   // Open Edit Modal
const handleEdit = (section) => {
setEditingSection(section);
setFormData({
section_id: section.section_id,
title: section.title || '',
subtitle: section.subtitle || '',
section_type: section.section_type || 'hero_campaign',
media_url: section.media_url || '',
poster_url: section.poster_url || '',
media_type: section.media_type || 'image',
cta_text: section.cta_text || '',
cta_link: section.cta_link || '',
is_active: section.is_active !== false,
display_order: section.display_order || 1,
items: Array.isArray(section.items) ? section.items : [],
});
setIsModalOpen(true);
};
118:   // Open Create Modal
const handleCreate = () => {
setEditingSection(null);
setFormData({
section_id: `sec_${Date.now()}`,
title: 'New Storefront Campaign',
subtitle: 'Curated athletic merchandise and exclusive offers',
section_type: 'curated_products',
media_url: '',
poster_url: '',
media_type: 'image',
cta_text: 'Shop Now',
cta_link: '/catalogue',
is_active: true,
display_order: (sections.length || 0) + 1,
items: [],
});
setIsModalOpen(true);
};
138:   // Save (Create or Update)
const handleSave = async (e) => {
e.preventDefault();
try {
setSaving(true);
if (editingSection) {
await api.put(`/admin/storefront/sections/${editingSection.section_id}`, formData);
setStatusMessage({ type: 'success', text: `Section "${formData.title}" updated successfully.` });
} else {
await api.post('/admin/storefront/sections', formData);
setStatusMessage({ type: 'success', text: `New section "${formData.title}" added to homepage.` });
}
setIsModalOpen(false);
await fetchSections();
} catch (err) {
const errMsg = err.response?.data?.detail || err.message || 'Save failed.';
setStatusMessage({ type: 'error', text: `Failed to save section: ${errMsg}` });
} finally {
setSaving(false);
}
};
160:   // Toggle Section Active Status
const handleToggleActive = async (section) => {
try {
const updatedStatus = !section.is_active;
await api.put(`/admin/storefront/sections/${section.section_id}`, {
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
178:   // Move Section Up or Down
const handleMove = async (index, direction) => {
const newIndex = direction === 'up' ? index - 1 : index + 1;
if (newIndex < 0 || newIndex >= sections.length) return;
183:     const updatedSections = [...sections];
const [moved] = updatedSections.splice(index, 1);
updatedSections.splice(newIndex, 0, moved);
187:     const reorderPayload = updatedSections.map((sec, idx) => ({
section_id: sec.section_id,
display_order: idx + 1,
}));
192:     // Optimistic local update
setSections(updatedSections.map((s, idx) => ({ ...s, display_order: idx + 1 })));
195:     try {
await api.put('/admin/storefront/sections/reorder', reorderPayload);
setStatusMessage({ type: 'success', text: 'Storefront section order updated.' });
} catch (err) {
setStatusMessage({ type: 'error', text: 'Failed to save section order.' });
await fetchSections();
}
};
204:   // Delete Section
const handleDelete = async (section) => {
if (!window.confirm(`Delete section "${section.title}"?`)) return;
try {
await api.delete(`/admin/storefront/sections/${section.section_id}`);
setStatusMessage({ type: 'success', text: 'Section deleted.' });
await fetchSections();
} catch (err) {
setStatusMessage({ type: 'error', text: 'Failed to delete section.' });
}
};
216:   // Seed / Reset to Standard Layout
const handleResetDefaults = async () => {
if (!window.confirm('Reset homepage layout to the 8 standard Phase 6.3 sections?')) return;
try {
setLoading(true);
await api.post('/admin/storefront/sections/seed-defaults');
setStatusMessage({ type: 'success', text: 'Homepage sections restored to default layout.' });
await fetchSections();
} catch (err) {
setStatusMessage({ type: 'error', text: 'Failed to reset sections.' });
} finally {
setLoading(false);
}
};
231:   // Choose from Media Studio
const handleSelectMediaAsset = (asset) => {
if (mediaPickerTarget === 'media_url') {
setFormData((prev) => ({
...prev,
media_url: asset.url,
media_type: asset.media_type,
poster_url: asset.poster_url || (asset.media_type === 'image' ? asset.url : prev.poster_url),
}));
} else if (mediaPickerTarget === 'poster_url') {
setFormData((prev) => ({
...prev,
poster_url: asset.url,
}));
}
setShowMediaPicker(false);
};
249:   return (
<div className="space-y-6">
{/* Header */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
<div>
<div className="flex items-center gap-2">
<h1 className="text-2xl font-black text-slate-900 tracking-tight">Storefront Merchandising</h1>
<Badge variant="primary" className="bg-primary-950 text-white font-bold">Homepage Builder</Badge>
</div>
<p className="text-sm text-slate-500 mt-1">
Configure dynamic homepage campaign videos, featured collections, product carousels, and editorial banners without rebuilding frontend code.
</p>
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
315:       {/* Sections List */}
{loading ? (
<div className="p-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
<RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-500 mb-2" />
<p className="text-sm">Loading storefront merchandising configuration...</p>
</div>
) : sections.length === 0 ? (
<div className="p-16 text-center bg-white rounded-xl border border-slate-200">
<Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
<h3 className="font-bold text-slate-700">No storefront sections configured</h3>
<p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
Click Reset Defaults to restore the standard 8 high-performance Phase 6.3 homepage sections.
</p>
<Button variant="primary" size="sm" onClick={handleResetDefaults} className="mt-4">
Restore Defaults
</Button>
</div>
) : (
<div className="space-y-3">
{sections.map((section, idx) => (
<Card
key={section.section_id}
className={`p-4 bg-white border transition-all ${
section.is_active ? 'border-slate-200 shadow-sm' : 'border-dashed border-slate-300 bg-slate-50/50 opacity-75'
}`}
>
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
{/* Order & Drag Indicator */}
<div className="flex items-center gap-3">
<div className="flex flex-col items-center">
<button
onClick={() => handleMove(idx, 'up')}
disabled={idx === 0}
className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20"
title="Move Up"
>
<ArrowUp className="w-4 h-4" />
</button>
<span className="font-mono text-xs font-bold text-slate-500">{idx + 1}</span>
<button
onClick={() => handleMove(idx, 'down')}
disabled={idx === sections.length - 1}
className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20"
title="Move Down"
>
<ArrowDown className="w-4 h-4" />
</button>
</div>
364:                   {/* Media Thumbnail */}
<div className="w-20 h-14 bg-slate-900 rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center">
{section.media_type === 'video' ? (
<>
{section.poster_url ? (
<img src={section.poster_url} alt="" className="w-full h-full object-cover" />
) : (
<Film className="w-6 h-6 text-indigo-400" />
)}
<span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] text-white font-bold flex items-center gap-0.5">
<Film className="w-2.5 h-2.5" /> MP4
</span>
</>
) : section.media_url ? (
<img src={section.media_url} alt="" className="w-full h-full object-cover" />
) : (
<ImageIcon className="w-6 h-6 text-slate-600" />
)}
</div>
384:                   {/* Section Details */}
<div>
<div className="flex items-center gap-2">
<span className="font-bold text-slate-900 text-sm">{section.title}</span>
<span
className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
section.media_type === 'video' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'
}`}
>
{section.section_type}
</span>
{!section.is_active && (
<span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
DRAFT / HIDDEN
</span>
)}
</div>
<div className="text-xs text-slate-500 mt-0.5 max-w-xl truncate">
{section.subtitle || 'No description configured'}
</div>
{section.cta_link && (
<div className="text-[11px] text-primary-600 mt-1 font-medium flex items-center gap-1">
<span>CTA: {section.cta_text || 'Link'}</span>
<span className="text-slate-400 font-mono">({section.cta_link})</span>
</div>
)}
</div>
</div>
413:                 {/* Right Actions */}
<div className="flex items-center gap-2 self-end sm:self-auto">
<button
onClick={() => handleToggleActive(section)}
className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
section.is_active
? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
: 'bg-slate-200 text-slate-700 hover:bg-slate-300'
}`}
>
{section.is_active ? 'Active' : 'Draft'}
</button>
<Button
variant="outline"
size="sm"
onClick={() => handleEdit(section)}
leftIcon={<Edit2 className="w-3.5 h-3.5" />}
>
Configure
</Button>
<button
onClick={() => handleDelete(section)}
className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
title="Delete section"
>
<Trash2 className="w-4 h-4" />
</button>
</div>
</div>
</Card>
))}
</div>
)}
447:       {/* =========================================================================
SECTION EDIT / CREATE MODAL
========================================================================= */}
{isModalOpen && (
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
<div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
{/* Modal Header */}
<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
<div>
<h3 className="font-black text-lg text-slate-900">
{editingSection ? `Configure "${editingSection.title}"` : 'Add Storefront Section'}
</h3>
<p className="text-xs text-slate-500">
Update customer-facing text, campaign media (image/video), poster fallbacks, and CTAs.
</p>
</div>
<button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
<X className="w-5 h-5" />
</button>
</div>
468:             {/* Modal Body */}
<form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
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
<label className="block text-xs font-bold text-slate-700 mb-1">Section Type</label>
<select
value={formData.section_type}
onChange={(e) => setFormData({ ...formData, section_type: e.target.value })}
className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
>
{Object.entries(SECTION_TYPE_LABELS).map(([k, label]) => (
<option key={k} value={k}>
{label}
</option>
))}
</select>
</div>
</div>
497:               <div>
<label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Campaign Narrative</label>
<textarea
rows={2}
value={formData.subtitle}
onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
/>
</div>
507:               {/* Media Configuration */}
<div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
<div className="flex items-center justify-between">
<span className="font-bold text-xs uppercase tracking-wider text-slate-800">
Campaign Media & Video
</span>
<div className="flex items-center gap-2">
<label className="text-xs font-semibold text-slate-600 flex items-center gap-1 cursor-pointer">
<input
type="radio"
name="media_type"
value="image"
checked={formData.media_type === 'image'}
onChange={() => setFormData({ ...formData, media_type: 'image' })}
/>
Image
</label>
<label className="text-xs font-semibold text-slate-600 flex items-center gap-1 cursor-pointer">
<input
type="radio"
name="media_type"
value="video"
checked={formData.media_type === 'video'}
onChange={() => setFormData({ ...formData, media_type: 'video' })}
/>
Video (MP4 / WebM)
</label>
</div>
</div>
537:                 {/* Primary Media URL */}
<div>
<div className="flex items-center justify-between mb-1">
<label className="text-xs font-bold text-slate-700">
Primary Media URL ({formData.media_type})
</label>
<button
type="button"
onClick={() => {
setMediaPickerTarget('media_url');
setShowMediaPicker(true);
}}
className="text-xs text-primary-600 font-bold hover:underline flex items-center gap-1"
>
<Sparkles className="w-3 h-3" /> Select from Media Studio
</button>
</div>
<input
type="text"
value={formData.media_url}
onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
placeholder="/uploads/media/videos/hero_campaign_track.mp4"
className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
/>
</div>
563:                 {/* Poster / Fallback URL */}
<div>
<div className="flex items-center justify-between mb-1">
<label className="text-xs font-bold text-slate-700">
Poster Image URL (fallback & pre-playback poster)
</label>
<button
type="button"
onClick={() => {
setMediaPickerTarget('poster_url');
setShowMediaPicker(true);
}}
className="text-xs text-primary-600 font-bold hover:underline flex items-center gap-1"
>
<Sparkles className="w-3 h-3" /> Select Poster
</button>
</div>
<input
type="text"
value={formData.poster_url}
onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
placeholder="/uploads/media/images/hero_poster.jpg"
className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
/>
</div>
</div>
590:               {/* CTA Details */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
<div>
<label className="block text-xs font-bold text-slate-700 mb-1">CTA Button Text</label>
<input
type="text"
value={formData.cta_text}
onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
placeholder="e.g. Shop Best Sellers"
className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
/>
</div>
<div>
<label className="block text-xs font-bold text-slate-700 mb-1">CTA Destination Link</label>
<input
type="text"
value={formData.cta_link}
onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
placeholder="e.g. /catalogue?category=GEARS"
className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
/>
</div>
</div>
614:               {/* Visibility Switch */}
<div className="flex items-center gap-2 pt-2">
<input
type="checkbox"
id="section_is_active"
checked={formData.is_active}
onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
/>
<label htmlFor="section_is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
Section is Published (Visible on Storefront)
</label>
</div>
628:               {/* Actions */}
<div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
<Button variant="outline" size="md" onClick={() => setIsModalOpen(false)}>
Cancel
</Button>
<Button variant="primary" size="md" type="submit" isLoading={saving}>
Save Section
</Button>
</div>
</form>
</div>
</div>
)}
642:       {/* =========================================================================
MEDIA QUICK-PICKER MODAL
========================================================================= */}
{showMediaPicker && (
<div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
<div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl p-6 max-h-[80vh] flex flex-col">
<div className="flex items-center justify-between pb-3 border-b border-slate-100">
<h4 className="font-black text-slate-900">Select Asset from Media Studio</h4>
<button onClick={() => setShowMediaPicker(false)} className="text-slate-400 hover:text-slate-600">
<X className="w-5 h-5" />
</button>
</div>
<div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-4 overflow-y-auto flex-1">
{mediaAssets.map((asset) => (
<div
key={asset.media_id}
onClick={() => handleSelectMediaAsset(asset)}
className="border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:border-primary-500 hover:shadow-md transition-all group"
>
<div className="aspect-video bg-black flex items-center justify-center relative overflow-hidden">
{asset.media_type === 'video' ? (
<>
{asset.poster_url ? (
<img src={asset.poster_url} alt="" className="w-full h-full object-cover" />
) : (
<Film className="w-6 h-6 text-indigo-400" />
)}
<span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[8px] text-white">
MP4
</span>
</>
) : (
<img src={asset.url} alt="" className="w-full h-full object-cover" />
)}
</div>
<div className="p-1.5 bg-white">
<div className="text-[11px] font-bold text-slate-800 truncate">{asset.display_name}</div>
<div className="text-[10px] text-slate-400 font-mono truncate">{asset.media_type}</div>
</div>
</div>
))}
</div>
</div>
</div>
)}
</div>
);
}
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
