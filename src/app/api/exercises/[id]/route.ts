import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { GetExerciseParamsSchema, UpdateExerciseSchema } from '@/features/exercises/builder/api/contracts';
import { getExercise } from '@/features/exercises/builder/server/get-exercise';
import { updateExercise } from '@/features/exercises/builder/server/update-exercise';
import { deleteExercise } from '@/features/exercises/builder/server/delete-exercise';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetExerciseParamsSchema.parse(await params);
    const response = await getExercise(id);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetExerciseParamsSchema.parse(await params);
    const body = await req.json();
    const input = UpdateExerciseSchema.parse(body);
    const response = await updateExercise(id, input);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetExerciseParamsSchema.parse(await params);
    const response = await deleteExercise(id);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}
