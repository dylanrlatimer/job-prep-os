import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { parseListQuery } from '@/common/lib/pagination';
import { BrowseListQuerySchema } from '@/features/theory/browse/api/contracts';
import { listBrowse } from '@/features/theory/browse/server/list-browse';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const query = parseListQuery(BrowseListQuerySchema, req.nextUrl.searchParams);
    const response = await listBrowse(query);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}
