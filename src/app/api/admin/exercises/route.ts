import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { CreateSystemExerciseSchema } from '@/features/admin/exercises/api/contracts';
import { createSystemExercise } from '@/features/admin/exercises/server/create-system-exercise';
import { listSystemExercises } from '@/features/admin/exercises/server/list-system-exercises';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const response = await listSystemExercises();
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const input = CreateSystemExerciseSchema.parse(body);
    const response = await createSystemExercise(input);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(req, error);
  }
}
