import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Image, Plus, Calendar, Tag, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.get('/banners?include_inactive=true')
      .then((res) => {
        if (isMounted) {
          setBanners(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {
        if (isMounted) setBanners([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Image className="w-6 h-6 text-primary-600" /> Promotional Banners ({banners.length})
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Dynamic-First Banners: Live promotions retrieved from MongoDB <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">banners</code> collection.
          </p>
        </div>
        <Button variant="primary" disabled leftIcon={<Plus className="w-4 h-4" />}>
          Add New Banner (Prompt #7)
        </Button>
      </div>

      {loading ? (
        <Card className="p-6">
          <p className="text-sm text-slate-500">Loading banners from database...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {banners.map((b) => (
            <Card key={b._id || b.title} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <Image className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{b.title}</h3>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-primary-600" />
                      Position: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{b.position}</code>
                    </span>
                    <span>Link: <code className="text-primary-600">{b.link}</code></span>
                    {b.start_date && b.end_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(b.start_date).toLocaleDateString()} to {new Date(b.end_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button variant="secondary" size="sm" disabled>
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
