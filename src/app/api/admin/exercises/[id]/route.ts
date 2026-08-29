import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { GetSystemExerciseParamsSchema, UpdateSystemExerciseSchema } from '@/features/admin/exercises/api/contracts';
import { deleteSystemExercise } from '@/features/admin/exercises/server/delete-system-exercise';
import { getSystemExercise } from '@/features/admin/exercises/server/get-system-exercise';
import { updateSystemExercise } from '@/features/admin/exercises/server/update-system-exercise';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetSystemExerciseParamsSchema.parse(await params);
    const response = await getSystemExercise(id);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetSystemExerciseParamsSchema.parse(await params);
    const body = await req.json();
    const input = UpdateSystemExerciseSchema.parse(body);
    const response = await updateSystemExercise(id, input);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetSystemExerciseParamsSchema.parse(await params);
    const response = await deleteSystemExercise(id);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}
