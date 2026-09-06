import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { parseListQuery } from '@/common/lib/pagination';
import { BrowseExerciseListQuerySchema } from '@/features/exercises/browse/api/contracts';
import { listBrowse } from '@/features/exercises/browse/server/list-browse';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const query = parseListQuery(BrowseExerciseListQuerySchema, req.nextUrl.searchParams);
    const response = await listBrowse(query);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
