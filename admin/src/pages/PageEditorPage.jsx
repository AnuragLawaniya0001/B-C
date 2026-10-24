import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Save, Layers, Sparkles, Globe, Eye } from 'lucide-react';

export default function PageEditorPage() {
  const { slug } = useParams();

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
            <Layers className="w-6 h-6 text-primary-600" /> Page Editor: <span className="font-mono text-primary-700">{slug}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Dynamic layout builder &bull; Section toggling, ordering & content stored in MongoDB <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">pages</code> collection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" disabled rightIcon={<Save className="w-4 h-4" />}>
            Save Page (Prompt #7)
          </Button>
        </div>
      </div>

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
              defaultValue={`Bigchamp — ${slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Page'}`}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800"
              disabled
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">OpenGraph Image URL</label>
            <input
              type="text"
              defaultValue="https://bigchamp.in/assets/og-banner.jpg"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800"
              disabled
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Meta Description</label>
            <textarea
              rows={2}
              defaultValue="Official Bigchamp platform page for sports athletes, student dormitories and defense personnel privileges."
              className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800"
              disabled
            />
          </div>
        </div>
      </Card>

      {/* Dynamic Sections Manager */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-600" /> Dynamic Sections & Content Blocks
            </h2>
            <p className="text-xs text-slate-500">Enable/disable, reorder, or edit content. Changes reflect live on the website.</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="p-4 border rounded-lg bg-slate-50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary-100 text-primary-800 flex items-center justify-center text-xs font-bold">1</span>
                <span className="text-sm font-bold text-slate-800">Hero Section (type: &quot;hero&quot;)</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">Enabled</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-8">Headline: &quot;India ka Pehla Sports Ecosystem&quot; &bull; CTA: &quot;Join Now&quot;</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">id: hero</span>
          </div>

          <div className="p-4 border rounded-lg bg-slate-50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary-100 text-primary-800 flex items-center justify-center text-xs font-bold">2</span>
                <span className="text-sm font-bold text-slate-800">Benefits Grid (type: &quot;benefits&quot;)</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">Enabled</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-8">4 feature cards (Defense, Dorms, Physio, Cookey)</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">id: benefits</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
