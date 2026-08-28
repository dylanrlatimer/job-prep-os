import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { PracticeQuestionParamsSchema } from '@/features/theory/practice/api/contracts';
import { getPracticeReview } from '@/features/theory/practice/server/get-practice-review';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = PracticeQuestionParamsSchema.parse(await params);
    const response = await getPracticeReview(id);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
