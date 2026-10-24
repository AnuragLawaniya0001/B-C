import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileText, Edit3 } from 'lucide-react';
import api from '../services/api';

export default function PagesPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.get('/pages')
      .then((res) => {
        if (isMounted) {
          setPages(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {
        if (isMounted) setPages([]);
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
            <FileText className="w-6 h-6 text-primary-600" /> CMS Pages Manager ({pages.length})
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Dynamic-First CMS: Live page layouts and sections retrieved from MongoDB <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">pages</code> collection.
          </p>
        </div>
      </div>

      {loading ? (
        <Card className="p-6">
          <p className="text-sm text-slate-500">Loading pages from database...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pages.map((p) => {
            const sectionsCount = Array.isArray(p.sections) ? p.sections.length : 0;

            return (
              <Card key={p._id || p.slug} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-primary-200 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                      <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        slug: {p.slug}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {p.meta?.description || 'Dynamic CMS page'} &bull; {sectionsCount} dynamic sections
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Link to={`/pages/edit/${p.slug}`}>
                    <Button variant="secondary" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                      Edit Content
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
