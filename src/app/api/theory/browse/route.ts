import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { listBrowse } from '@/features/theory/browse/server/list-browse';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const response = await listBrowse();
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
