import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { ExerciseDetailParamsSchema } from '@/features/exercises/detail/api/contracts';
import { getExerciseDetail } from '@/features/exercises/detail/server/get-exercise-detail';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = ExerciseDetailParamsSchema.parse(await params);
    const response = await getExerciseDetail(id);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
