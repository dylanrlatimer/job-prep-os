import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { SessionItemParamsSchema } from '@/features/practice/sessions/api/contracts';
import { skipSessionItem } from '@/features/practice/sessions/server/skip-session-item';

type RouteContext = {
  params: Promise<{ id: string; itemId: string }>;
};

export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id, itemId } = SessionItemParamsSchema.parse(await params);
    const response = await skipSessionItem(id, itemId);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}
