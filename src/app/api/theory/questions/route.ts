import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { CreateQuestionSchema } from '@/features/theory/builder/api/contracts';
import { createQuestion } from '@/features/theory/builder/server/create-question';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const input = CreateQuestionSchema.parse(body);
    const response = await createQuestion(input);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(req, error);
  }
}
