import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Loader2 } from 'lucide-react';

export function AuthBootstrap({ children }) {
  const [bootstrapping, setBootstrapping] = useState(true);
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const token = localStorage.getItem('bc_access_token');
      if (token) {
        try {
          await fetchMe();
        } catch (_) {
          // Token expired or invalid — fetchMe automatically clears auth if unrefreshable
        }
      }

      if (isMounted) {
        setBootstrapping(false);
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchMe]);

  if (bootstrapping) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="text-2xl font-black tracking-tight text-primary-900 mb-4 animate-pulse">
          BIG<span className="text-accent-500">CHAMP</span>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary-900" />
      </div>
    );
  }

  return children;
}

export default AuthBootstrap;
