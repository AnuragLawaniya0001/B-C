import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-6xl font-black text-primary-900 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h2>
      <p className="text-slate-600 mb-6 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Homepage</Button>
      </Link>
    </div>
  );
}
