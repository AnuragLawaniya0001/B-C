import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { HelpCircle, Plus, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function FaqsPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.get('/faqs')
      .then((res) => {
        if (isMounted) {
          setFaqs(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {
        if (isMounted) setFaqs([]);
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
            <HelpCircle className="w-6 h-6 text-primary-600" /> FAQs Manager ({faqs.length})
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Dynamic-First FAQs: Categorized questions and answers retrieved from MongoDB <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">faqs</code> collection.
          </p>
        </div>
        <Button variant="primary" disabled leftIcon={<Plus className="w-4 h-4" />}>
          Add New FAQ (Prompt #7)
        </Button>
      </div>

      {loading ? (
        <Card className="p-6">
          <p className="text-sm text-slate-500">Loading FAQs from database...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {faqs.map((faq, idx) => (
            <Card key={faq._id || idx} className="p-5 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded bg-primary-100 text-primary-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {faq.order || idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{faq.question}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                    {faq.category}
                  </span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
