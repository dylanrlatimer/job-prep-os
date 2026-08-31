import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { getSessionSetup } from '@/features/practice/sessions/server/get-session-setup';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const response = await getSessionSetup();
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
