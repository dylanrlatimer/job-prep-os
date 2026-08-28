import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { listRepository } from '@/features/theory/repository/server/list-repository';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const response = await listRepository();
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
