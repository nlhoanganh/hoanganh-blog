import { useState, useEffect, useCallback } from 'react';
import { getPost } from '../api/postApi';
import type { Post } from '../types';

export function usePost(id: number) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPost(id);
      setPost(response.data);
    } catch {
      setError('Post not found or failed to load.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { post, loading, error, refetch: fetch };
}
