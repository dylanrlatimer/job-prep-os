import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { CreateSessionSchema } from '@/features/practice/sessions/api/contracts';
import { createSession } from '@/features/practice/sessions/server/create-session';
import { listActiveSessions } from '@/features/practice/sessions/server/list-active-sessions';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const response = await listActiveSessions();
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const input = CreateSessionSchema.parse(body);
    const response = await createSession(input);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(req, error);
  }
}
