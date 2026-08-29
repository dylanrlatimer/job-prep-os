import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-errors';
import { saveExercise } from '@/features/exercises/browse/server/save-exercise';

const SaveExerciseParamsSchema = z.object({
  id: z.uuid(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = SaveExerciseParamsSchema.parse(await params);
    const response = await saveExercise(id);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(req, error);
  }
}
