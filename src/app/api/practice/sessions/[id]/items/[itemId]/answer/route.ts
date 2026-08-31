import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { SessionItemParamsSchema } from '@/features/practice/sessions/api/contracts';
import { answerSessionItem } from '@/features/practice/sessions/server/answer-session-item';

type RouteContext = {
  params: Promise<{ id: string; itemId: string }>;
};

export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id, itemId } = SessionItemParamsSchema.parse(await params);
    const body = await req.json();
    const response = await answerSessionItem(id, itemId, body);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(req, error);
  }
}
