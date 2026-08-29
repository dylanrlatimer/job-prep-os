import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { UnsaveRepositoryQuestionParamsSchema } from '@/features/theory/repository/api/contracts';
import { unsaveRepositoryQuestion } from '@/features/theory/repository/server/unsave-repository-question';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = UnsaveRepositoryQuestionParamsSchema.parse(await params);
    const response = await unsaveRepositoryQuestion(id);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}
