import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { CreateSessionSchema } from '@/features/practice/sessions/api/contracts';
import { previewSession } from '@/features/practice/sessions/server/preview-session';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const input = CreateSessionSchema.parse(body);
    const response = await previewSession(input);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
