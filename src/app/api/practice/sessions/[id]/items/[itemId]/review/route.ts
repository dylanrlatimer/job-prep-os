import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { SessionItemParamsSchema } from '@/features/practice/sessions/api/contracts';
import { getSessionItemReview } from '@/features/practice/sessions/server/get-session-item-review';

type RouteContext = {
  params: Promise<{ id: string; itemId: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id, itemId } = SessionItemParamsSchema.parse(await params);
    const response = await getSessionItemReview(id, itemId);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
