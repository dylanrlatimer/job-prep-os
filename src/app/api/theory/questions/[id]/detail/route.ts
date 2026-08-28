import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { QuestionDetailParamsSchema } from '@/features/theory/detail/api/contracts';
import { getQuestionDetail } from '@/features/theory/detail/server/get-question-detail';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = QuestionDetailParamsSchema.parse(await params);
    const response = await getQuestionDetail(id);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
