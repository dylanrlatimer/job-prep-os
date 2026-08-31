import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { listCompletedSessions } from '@/features/practice/sessions/server/list-completed-sessions';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const response = await listCompletedSessions();
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
