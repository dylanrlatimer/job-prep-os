import { z } from 'zod';
import { ListPageSchema, optionalListSearchSchema, optionalListTopicIdSchema } from '@/common/lib/pagination';

export type BrowseKind = 'all' | 'questions' | 'exercises';
export type BrowseSavedFilter = 'all' | 'new' | 'saved';

export const BrowsePageQuerySchema = ListPageSchema.extend({
  search: optionalListSearchSchema,
  topicId: optionalListTopicIdSchema,
  saved: z.enum(['all', 'new', 'saved']).optional().default('new'),
  kind: z.enum(['all', 'questions', 'exercises']).optional().default('all'),
});

export type BrowsePageQuery = Omit<z.infer<typeof BrowsePageQuerySchema>, 'saved' | 'kind'> & {
  saved: BrowseSavedFilter;
  kind: BrowseKind;
};

export function parseBrowseKind(value: string | undefined): BrowseKind {
  if (value === 'questions' || value === 'exercises') {
    return value;
  }

  return 'all';
}
