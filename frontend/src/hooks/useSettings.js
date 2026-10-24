import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Hook to fetch public business rules and global site settings.
 * STUB: returns null / empty values until full DB seed and settings CRUD are implemented.
 * Supports both destructured: const { data } = useSettings(...) 
 * and direct object access: const settings = useSettings('business_rules');
 */
export function useSettings(key) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.get('/settings/public')
      .then((res) => {
        if (isMounted) {
          const val = key && res.data ? res.data[key] : res.data;
          setData(val ?? null);
        }
      })
      .catch(() => {
        if (isMounted) setData(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [key]);

  return {
    data,
    loading,
    ...(typeof data === 'object' && data !== null ? data : {}),
  };
}

export default useSettings;
