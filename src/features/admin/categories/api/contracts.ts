import { z } from 'zod';

export const CategoryInputSchema = z.object({
  name: z.string().trim().min(1, { error: 'categoryNameRequired' }),
});

export type CategoryInput = z.infer<typeof CategoryInputSchema>;

export const UpdateCategorySchema = z.object({
  name: z.string().trim().min(1, { error: 'categoryNameRequired' }),
  isActive: z.boolean(),
});

export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

export const GetCategoryParamsSchema = z.object({
  id: z.uuid(),
});

export type AdminCategoryItem = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  questionCount: number;
};

export type ListAdminCategoriesResponse = {
  categories: AdminCategoryItem[];
};

export type CategoryResponse = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  questionCount: number;
};

export type CreateCategoryResponse = {
  id: string;
};

export type UpdateCategoryResponse = {
  id: string;
};

export type DeleteCategoryResponse = {
  id: string;
};
