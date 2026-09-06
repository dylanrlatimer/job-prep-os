import { z } from 'zod';
import { ListPageSchema, optionalListSearchSchema, type ListPageMeta } from '@/common/lib/pagination';
import { TOPIC_ICON_KEYS } from '@/common/topics/icon-keys';

const TopicIconKeySchema = z.enum(TOPIC_ICON_KEYS).nullable();

export const TopicInputSchema = z.object({
  name: z.string().trim().min(1, { error: 'topicNameRequired' }),
  iconKey: TopicIconKeySchema,
});

export type TopicInput = z.infer<typeof TopicInputSchema>;

export const UpdateTopicSchema = z.object({
  name: z.string().trim().min(1, { error: 'topicNameRequired' }),
  isActive: z.boolean(),
  iconKey: TopicIconKeySchema,
});

export type UpdateTopicInput = z.infer<typeof UpdateTopicSchema>;

export const GetTopicParamsSchema = z.object({
  id: z.uuid(),
});

export type AdminTopicItem = {
  id: string;
  name: string;
  slug: string;
  iconKey: string | null;
  isActive: boolean;
  questionCount: number;
  exerciseCount: number;
};

export const AdminTopicListQuerySchema = ListPageSchema.extend({
  search: optionalListSearchSchema,
  status: z.enum(['all', 'active', 'disabled']).optional().default('all'),
});

export type TopicStatusFilter = 'all' | 'active' | 'disabled';

export type AdminTopicListQuery = Omit<z.infer<typeof AdminTopicListQuerySchema>, 'status'> & {
  status: TopicStatusFilter;
};

export type ListAdminTopicsResponse = {
  topics: AdminTopicItem[];
} & ListPageMeta;

export type TopicResponse = {
  id: string;
  name: string;
  slug: string;
  iconKey: string | null;
  isActive: boolean;
  questionCount: number;
  exerciseCount: number;
};

export type CreateTopicResponse = {
  id: string;
};

export type UpdateTopicResponse = {
  id: string;
};

export type DeleteTopicResponse = {
  id: string;
};
