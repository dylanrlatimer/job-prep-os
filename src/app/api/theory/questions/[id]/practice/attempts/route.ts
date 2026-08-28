import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { CreateAttemptSchema, PracticeQuestionParamsSchema } from '@/features/theory/practice/api/contracts';
import { createAttempt } from '@/features/theory/practice/server/create-attempt';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = PracticeQuestionParamsSchema.parse(await params);
    const body = await req.json();
    const input = CreateAttemptSchema.parse(body);
    const response = await createAttempt(id, input);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(req, error);
  }
}
