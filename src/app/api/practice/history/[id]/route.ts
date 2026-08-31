import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { SessionParamsSchema } from '@/features/practice/sessions/api/contracts';
import { getSessionHistoryDetail } from '@/features/practice/sessions/server/get-session-history-detail';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = SessionParamsSchema.parse(await params);
    const response = await getSessionHistoryDetail(id);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
