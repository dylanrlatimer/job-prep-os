import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { TopicInputSchema } from '@/features/admin/topics/api/contracts';
import { createTopic } from '@/features/admin/topics/server/create-topic';
import { listAdminTopics } from '@/features/admin/topics/server/list-topics';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const response = await listAdminTopics();
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const input = TopicInputSchema.parse(body);
    const response = await createTopic(input);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(req, error);
  }
}
