import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { BrowseExerciseDetailParamsSchema } from '@/features/exercises/browse/api/contracts';
import { getBrowseExerciseDetail } from '@/features/exercises/browse/server/get-browse-exercise-detail';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = BrowseExerciseDetailParamsSchema.parse(await params);
    const response = await getBrowseExerciseDetail(id);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
