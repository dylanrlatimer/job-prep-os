import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { PracticeQuestionParamsSchema } from '@/features/theory/practice/api/contracts';
import { getPracticeQuestion } from '@/features/theory/practice/server/get-practice-question';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = PracticeQuestionParamsSchema.parse(await params);
    const response = await getPracticeQuestion(id);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
