import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-errors';
import { saveBrowseQuestion } from '@/features/theory/browse/server/save-browse-question';

const SaveBrowseQuestionParamsSchema = z.object({
  id: z.uuid(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = SaveBrowseQuestionParamsSchema.parse(await params);
    const response = await saveBrowseQuestion(id);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(req, error);
  }
}
