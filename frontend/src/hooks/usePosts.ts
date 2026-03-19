import { useState, useEffect, useCallback } from 'react';
import { getPosts } from '../api/postApi';
import type { PostSummary, PagedResponse } from '../types';

export function usePosts(size = 6) {
  const [data, setData] = useState<PagedResponse<PostSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPosts(page, size);
      setData(response.data);
    } catch {
      setError('Failed to load posts. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, page, setPage, refetch: fetch };
}
