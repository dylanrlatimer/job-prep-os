import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { GetQuestionParamsSchema, UpdateQuestionSchema } from '@/features/theory/builder/api/contracts';
import { getQuestion } from '@/features/theory/builder/server/get-question';
import { updateQuestion } from '@/features/theory/builder/server/update-question';
import { deleteQuestion } from '@/features/theory/builder/server/delete-question';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetQuestionParamsSchema.parse(await params);
    const response = await getQuestion(id);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetQuestionParamsSchema.parse(await params);
    const body = await req.json();
    const input = UpdateQuestionSchema.parse(body);
    const response = await updateQuestion(id, input);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetQuestionParamsSchema.parse(await params);
    const response = await deleteQuestion(id);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}
