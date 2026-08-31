'use client';

import { useMemo } from 'react';
import Fuse from 'fuse.js';
import type { BuilderTopic } from '@/features/theory/builder/api/contracts';

export function useFilteredTopics(topics: BuilderTopic[], query: string): BuilderTopic[] {
  const fuse = useMemo(
    () =>
      new Fuse(topics, {
        keys: ['name', 'slug'],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [topics],
  );

  return useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return topics;
    return fuse.search(trimmed).map((result) => result.item);
  }, [fuse, query, topics]);
}
