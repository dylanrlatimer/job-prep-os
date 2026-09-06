import { and, ilike, type Column, type SQL } from 'drizzle-orm';
import { z } from 'zod';

export const PAGE_SIZE = 20;

export const ListPageSchema = z.object({
  page: z.preprocess((value) => (value === '' || value === undefined ? 1 : value), z.coerce.number().int().min(1)),
});

export const optionalListSearchSchema = z.string().optional().default('');

export const optionalListTopicIdSchema = z
  .string()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .pipe(z.uuid().optional());

export type ListPageMeta = {
  page: number;
  pageSize: number;
  totalCount: number;
  unfilteredCount: number;
};

export function listOffset(page: number) {
  return (page - 1) * PAGE_SIZE;
}

export function lastPage(totalCount: number) {
  return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
}

export function listPageMeta(page: number, totalCount: number, unfilteredCount: number): ListPageMeta {
  return { page, pageSize: PAGE_SIZE, totalCount, unfilteredCount };
}

export function parseListQuery<T extends z.ZodType>(schema: T, searchParams: URLSearchParams): z.infer<T> {
  return schema.parse(Object.fromEntries(searchParams.entries()));
}

export function toListSearchParams(params: Record<string, string | number | null | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    searchParams.set(key, String(value));
  }

  return searchParams.toString();
}

export function toListUrlSearchParams(
  params: Record<string, string | number | null | undefined>,
  defaults: Record<string, string | number | null | undefined> = {},
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    if (value === defaults[key]) continue;
    searchParams.set(key, String(value));
  }

  return searchParams.toString();
}

function escapeIlike(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

export function ilikeContains(column: Column | SQL, search: string): SQL {
  return ilike(column, `%${escapeIlike(search.trim())}%`);
}

export function andFilters(...conditions: Array<SQL | undefined>) {
  const defined = conditions.filter((condition): condition is SQL => condition !== undefined);
  if (defined.length === 0) return undefined;
  if (defined.length === 1) return defined[0];
  return and(...defined);
}
