import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { GetCategoryParamsSchema, UpdateCategorySchema } from '@/features/admin/categories/api/contracts';
import { deleteCategory } from '@/features/admin/categories/server/delete-category';
import { getCategory } from '@/features/admin/categories/server/get-category';
import { updateCategory } from '@/features/admin/categories/server/update-category';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetCategoryParamsSchema.parse(await params);
    const response = await getCategory(id);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetCategoryParamsSchema.parse(await params);
    const body = await req.json();
    const input = UpdateCategorySchema.parse(body);
    const response = await updateCategory(id, input);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetCategoryParamsSchema.parse(await params);
    const response = await deleteCategory(id);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}
