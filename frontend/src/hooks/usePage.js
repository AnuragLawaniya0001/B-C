import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Hook to fetch dynamic CMS page content and sections by slug.
 * STUB: returns null until full CMS seed and CRUD are implemented.
 */
export function usePage(slug) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!slug) {
      setLoading(false);
      return;
    }

    api.get(`/pages/${slug}`)
      .then((res) => {
        if (isMounted) {
          setData(res.data ?? null);
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
  }, [slug]);

  return {
    data,
    loading,
    ...(typeof data === 'object' && data !== null ? data : {}),
  };
}

export default usePage;
