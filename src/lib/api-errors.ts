import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError } from '@/lib/errors';

export function handleApiError(req: NextRequest, error: unknown) {
  const normalizedError = error instanceof Error ? error : new Error('Unknown error');

  console.error(`[SERVER ERROR] ${req.nextUrl.pathname}:`, error);

  if (normalizedError instanceof AppError) {
    return NextResponse.json({ message: normalizedError.message, code: normalizedError.code }, { status: normalizedError.status });
  }

  if (normalizedError instanceof z.ZodError) {
    return NextResponse.json({ message: normalizedError.issues[0].message, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  return NextResponse.json({ message: 'INTERNAL_SERVER_ERROR', code: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
}
