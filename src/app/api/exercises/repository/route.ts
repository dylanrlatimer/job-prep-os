import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { parseListQuery } from '@/common/lib/pagination';
import { ExerciseRepositoryListQuerySchema } from '@/features/exercises/repository/api/contracts';
import { listRepository } from '@/features/exercises/repository/server/list-repository';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const query = parseListQuery(ExerciseRepositoryListQuerySchema, req.nextUrl.searchParams);
    const response = await listRepository(query);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
