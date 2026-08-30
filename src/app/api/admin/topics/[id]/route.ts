import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { GetTopicParamsSchema, UpdateTopicSchema } from '@/features/admin/topics/api/contracts';
import { deleteTopic } from '@/features/admin/topics/server/delete-topic';
import { getTopic } from '@/features/admin/topics/server/get-topic';
import { updateTopic } from '@/features/admin/topics/server/update-topic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetTopicParamsSchema.parse(await params);
    const response = await getTopic(id);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetTopicParamsSchema.parse(await params);
    const body = await req.json();
    const input = UpdateTopicSchema.parse(body);
    const response = await updateTopic(id, input);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = GetTopicParamsSchema.parse(await params);
    const response = await deleteTopic(id);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}
