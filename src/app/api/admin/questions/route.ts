import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { CreateSystemQuestionSchema } from '@/features/admin/questions/api/contracts';
import { createSystemQuestion } from '@/features/admin/questions/server/create-system-question';
import { listSystemQuestions } from '@/features/admin/questions/server/list-system-questions';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const response = await listSystemQuestions();
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const input = CreateSystemQuestionSchema.parse(body);
    const response = await createSystemQuestion(input);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(req, error);
  }
}
