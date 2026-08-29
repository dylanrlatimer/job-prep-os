import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { CreateExerciseSchema } from '@/features/exercises/builder/api/contracts';
import { createExercise } from '@/features/exercises/builder/server/create-exercise';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const input = CreateExerciseSchema.parse(body);
    const response = await createExercise(input);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(req, error);
  }
}
