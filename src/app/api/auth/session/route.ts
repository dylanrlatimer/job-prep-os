import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/features/auth/server/get-session';
import { handleApiError } from '@/lib/api-errors';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const headers = { 'Cache-Control': 'no-store' as const };
    const response = await getSession();
    return NextResponse.json(response, { headers });
  } catch (error) {
    return handleApiError(req, error);
  }
}
