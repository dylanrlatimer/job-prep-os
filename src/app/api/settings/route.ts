import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { UpdateDisplayNameSchema } from '@/features/settings/api/contracts';
import { getSettings } from '@/features/settings/server/get-settings';
import { updateDisplayName } from '@/features/settings/server/update-display-name';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const response = await getSettings();
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const input = UpdateDisplayNameSchema.parse(body);
    const response = await updateDisplayName(input);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}
