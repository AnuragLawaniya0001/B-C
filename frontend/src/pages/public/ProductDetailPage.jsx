import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ProductDetailPage() {
  const { slug } = useParams();

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <Link to="/store" className="inline-flex items-center gap-2 text-sm text-primary-900 font-medium mb-6 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </Link>
      <h1 className="text-3xl font-bold text-slate-900">Product Details: {slug}</h1>
      <p className="text-slate-600 mt-2">
        Detailed view, specs, pricing, and member discounts coming soon.
      </p>
    </div>
  );
}
