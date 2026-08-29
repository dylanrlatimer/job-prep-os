import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { GetSystemQuestionParamsSchema, UpdateSystemQuestionSchema } from '@/features/admin/questions/api/contracts';
import { deleteSystemQuestion } from '@/features/admin/questions/server/delete-system-question';
import { getSystemQuestion } from '@/features/admin/questions/server/get-system-question';
import { updateSystemQuestion } from '@/features/admin/questions/server/update-system-question';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetSystemQuestionParamsSchema.parse(await params);
    const response = await getSystemQuestion(id);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetSystemQuestionParamsSchema.parse(await params);
    const body = await req.json();
    const input = UpdateSystemQuestionSchema.parse(body);
    const response = await updateSystemQuestion(id, input);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetSystemQuestionParamsSchema.parse(await params);
    const response = await deleteSystemQuestion(id);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}
