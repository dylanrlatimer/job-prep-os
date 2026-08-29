import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { BrowseQuestionDetailParamsSchema } from '@/features/theory/browse/api/contracts';
import { getBrowseQuestionDetail } from '@/features/theory/browse/server/get-browse-question-detail';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = BrowseQuestionDetailParamsSchema.parse(await params);
    const response = await getBrowseQuestionDetail(id);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
