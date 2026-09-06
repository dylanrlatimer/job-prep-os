'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { z } from 'zod';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useDebouncedValue } from '@/common/hooks/use-debounced-value';
import { lastPage, toListUrlSearchParams } from '@/common/lib/pagination';

type ListQueryValues = {
  page: number;
  search?: string;
  [key: string]: string | number | undefined;
};

export function useListQueryState<T extends z.ZodType<ListQueryValues>>(schema: T) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const defaults = useMemo(() => schema.parse({}), [schema]);
  const query = useMemo(() => {
    const parsed = schema.safeParse(Object.fromEntries(searchParams.entries()));
    return parsed.success ? parsed.data : defaults;
  }, [defaults, schema, searchParams]);

  const queryRef = useRef(query);
  queryRef.current = query;

  const replaceQuery = useCallback(
    (next: z.infer<T>) => {
      const qs = toListUrlSearchParams(next, defaults);
      const href = qs ? `${pathname}?${qs}` : pathname;
      router.replace(href);
    },
    [defaults, pathname, router],
  );

  const setQuery = useCallback(
    (patch: Partial<ListQueryValues>) => {
      replaceQuery({ ...queryRef.current, ...patch, page: 1 });
    },
    [replaceQuery],
  );

  const setPage = useCallback(
    (page: number) => {
      replaceQuery({ ...queryRef.current, page });
    },
    [replaceQuery],
  );

  const urlSearch = query.search ?? '';
  const [searchInput, setSearchInput] = useState(urlSearch);
  const lastWrittenSearch = useRef(urlSearch);
  const debouncedSearch = useDebouncedValue(searchInput);

  useEffect(() => {
    if (urlSearch !== lastWrittenSearch.current) {
      lastWrittenSearch.current = urlSearch;
      setSearchInput(urlSearch);
    }
  }, [urlSearch]);

  useEffect(() => {
    if (debouncedSearch === lastWrittenSearch.current) return;
    lastWrittenSearch.current = debouncedSearch;
    setQuery({ search: debouncedSearch });
  }, [debouncedSearch, setQuery]);

  return { query, setQuery, setPage, searchInput, setSearchInput };
}

export function useClampListQuery(page: number, totalCount: number | undefined, setPage: (page: number) => void) {
  useEffect(() => {
    if (totalCount === undefined) return;
    const maxPage = lastPage(totalCount);
    if (page > maxPage) setPage(maxPage);
  }, [page, setPage, totalCount]);
}
