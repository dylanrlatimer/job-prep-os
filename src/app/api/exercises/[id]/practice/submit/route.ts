import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { ExercisePracticeParamsSchema, SubmitExerciseAnswerSchema } from '@/features/exercises/practice/api/contracts';
import { submitAnswer } from '@/features/exercises/practice/server/submit-answer';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = ExercisePracticeParamsSchema.parse(await params);
    const body = await req.json();
    const input = SubmitExerciseAnswerSchema.parse(body);
    const response = await submitAnswer(id, input);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(req, error);
  }
}
