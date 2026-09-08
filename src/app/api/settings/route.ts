import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { UpdateSettingsSchema } from '@/features/settings/api/contracts';
import { getSettings } from '@/features/settings/server/get-settings';
import { updateSettings } from '@/features/settings/server/update-settings';

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
    const input = UpdateSettingsSchema.parse(body);
    const response = await updateSettings(input);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}
