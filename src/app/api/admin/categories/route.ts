import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { CategoryInputSchema } from '@/features/admin/categories/api/contracts';
import { createCategory } from '@/features/admin/categories/server/create-category';
import { listAdminCategories } from '@/features/admin/categories/server/list-categories';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const response = await listAdminCategories();
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const input = CategoryInputSchema.parse(body);
    const response = await createCategory(input);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(req, error);
  }
}
