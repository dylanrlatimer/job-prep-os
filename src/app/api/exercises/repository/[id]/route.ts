import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { UnsaveExerciseParamsSchema } from '@/features/exercises/repository/api/contracts';
import { unsaveExercise } from '@/features/exercises/repository/server/unsave-exercise';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = UnsaveExerciseParamsSchema.parse(await params);
    const response = await unsaveExercise(id);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}
