import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { ExercisePracticeParamsSchema } from '@/features/exercises/practice/api/contracts';
import { getPracticeExercise } from '@/features/exercises/practice/server/get-practice-exercise';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = ExercisePracticeParamsSchema.parse(await params);
    const response = await getPracticeExercise(id);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
