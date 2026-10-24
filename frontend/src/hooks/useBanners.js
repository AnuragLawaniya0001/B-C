import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Hook to fetch promotional banners, optionally filtered by page position.
 * STUB: returns empty array until banner seed and CRUD are implemented.
 */
export function useBanners(position) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const url = position
      ? `/banners?position=${encodeURIComponent(position)}`
      : '/banners';

    api.get(url)
      .then((res) => {
        if (isMounted) {
          setData(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {
        if (isMounted) setData([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [position]);

  return { data, loading };
}

export default useBanners;
